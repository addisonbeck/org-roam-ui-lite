import type { Core } from "cytoscape";
import { forceCollide } from "d3-force";
import { useCallback, useRef } from "react";
import { destroyGraph, drawGraph } from "../graph/graph.ts";
import {
	applyNodeStyle,
	highlightNeighborhood,
	resetHighlight,
} from "../graph/graph-style.ts";
import type {
	GraphInstance,
	Layout,
	PhysicsParams,
	Renderer,
	Theme,
} from "../graph/graph-types.ts";
import { openNode } from "../graph/node.ts";
import { useUiDispatch } from "../store/hooks.ts";

interface GraphConfig {
	renderer: Renderer;
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	showLabels: boolean;
	physicsParams: PhysicsParams;
}

interface UseGraphManagerProps extends GraphConfig {
	theme: Theme;
}

export function useGraphManager(initialConfig: UseGraphManagerProps) {
	const dispatch = useUiDispatch();
	const graphElementRef = useRef<HTMLDivElement | null>(null);
	const graphInstanceRef = useRef<GraphInstance | undefined>(undefined);
	const configRef = useRef<GraphConfig>({
		renderer: initialConfig.renderer,
		layout: initialConfig.layout,
		nodeSize: initialConfig.nodeSize,
		labelScale: initialConfig.labelScale,
		showLabels: initialConfig.showLabels,
		physicsParams: initialConfig.physicsParams,
	});
	const themeRef = useRef<Theme>(initialConfig.theme);

	const highlightNode = useCallback((nodeId: string) => {
		highlightNeighborhood(graphInstanceRef.current, nodeId);
	}, []);

	const resetNodeHighlight = useCallback(() => {
		resetHighlight(graphInstanceRef.current);
	}, []);

	const openNodeAction = useCallback(
		async (nodeId: string) => {
			const node = await openNode(themeRef.current, nodeId);
			dispatch({ type: "SET_STATE", payload: { selected: node } });
			dispatch({ type: "OPEN_DETAILS" });
			highlightNode(nodeId);
		},
		[dispatch, highlightNode],
	);

	const bindGraphEvents = useCallback(() => {
		const graph = graphInstanceRef.current;
		if (!graph) return;
		if (configRef.current.renderer === "cytoscape") {
			const cy = graph as Core;
			if (typeof cy.off === "function" && typeof cy.on === "function") {
				cy.off("tap", "node");
				cy.on("tap", "node", (evt) => {
					void openNodeAction(evt.target.id());
				});
			}
			return;
		}

		interface ClickableGraph {
			onNodeClick(cb: (node: { id: string }) => void): void;
		}
		const fg = graph as ClickableGraph;
		if (typeof fg.onNodeClick === "function") {
			fg.onNodeClick((node: { id: string }) => {
				void openNodeAction(node.id);
			});
		}
	}, [openNodeAction]);

	const refreshGraph = useCallback(async () => {
		const container = graphElementRef.current;
		if (!container) return;
		graphInstanceRef.current = await drawGraph(
			configRef.current.renderer,
			configRef.current.layout,
			container,
			graphInstanceRef.current,
			configRef.current.nodeSize,
			configRef.current.labelScale,
			configRef.current.showLabels,
			configRef.current.physicsParams,
		);
		bindGraphEvents();
	}, [bindGraphEvents]);

	const graphRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (node) {
				graphElementRef.current = node;
				void refreshGraph();
				return;
			}

			if (graphElementRef.current) {
				destroyGraph(graphInstanceRef.current, graphElementRef.current);
			}
			graphInstanceRef.current = undefined;
			graphElementRef.current = null;
		},
		[refreshGraph],
	);

	const setTheme = useCallback((theme: Theme) => {
		themeRef.current = theme;
	}, []);

	const setRenderer = useCallback(
		async (renderer: Renderer) => {
			configRef.current = {
				...configRef.current,
				renderer,
			};
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setLayout = useCallback(
		async (layout: Layout) => {
			configRef.current = { ...configRef.current, layout };
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setNodeSize = useCallback(
		async (nodeSize: number) => {
			configRef.current = { ...configRef.current, nodeSize };
			if (configRef.current.renderer === "cytoscape") {
				applyNodeStyle(graphInstanceRef.current as Core, {
					width: nodeSize,
					height: nodeSize,
				});
				return;
			}
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setLabelScale = useCallback(
		async (labelScale: number) => {
			configRef.current = { ...configRef.current, labelScale };
			if (configRef.current.renderer === "cytoscape") {
				applyNodeStyle(graphInstanceRef.current as Core, {
					"font-size": `${labelScale}em`,
				});
				return;
			}
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setShowLabels = useCallback(
		async (showLabels: boolean) => {
			configRef.current = { ...configRef.current, showLabels };
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setPhysicsParams = useCallback(
		async (physicsParams: PhysicsParams) => {
			configRef.current = { ...configRef.current, physicsParams };
			const renderer = configRef.current.renderer;
			const instance = graphInstanceRef.current;
			if (
				instance &&
				(renderer === "force-graph" || renderer === "3d-force-graph")
			) {
				// Update d3-force simulation directly to avoid triggering graphData()'s
				// internal update cycle, which conflicts with simulation reheat timing.
				const fg = instance as {
					d3Force(
						name: string,
					):
						| { strength(v: number): unknown; distance(v: number): unknown }
						| null
						| undefined;
					d3Force(name: string, force: unknown): unknown;
					d3ReheatSimulation(): unknown;
				};
				fg.d3Force("charge")?.strength(physicsParams.chargeStrength);
				fg.d3Force("link")?.distance(physicsParams.linkDistance);
				fg.d3Force("center")?.strength(physicsParams.centerForce);
				if (physicsParams.collisionEnabled) {
					fg.d3Force("collision", forceCollide(physicsParams.collisionRadius));
				} else {
					fg.d3Force("collision", null);
				}
				fg.d3ReheatSimulation();
			} else {
				await refreshGraph();
			}
		},
		[refreshGraph],
	);

	return {
		graphRef,
		openNodeAction,
		highlightNode,
		resetNodeHighlight,
		setTheme,
		setRenderer,
		setLayout,
		setNodeSize,
		setLabelScale,
		setShowLabels,
		setPhysicsParams,
		refreshGraph,
	};
}
