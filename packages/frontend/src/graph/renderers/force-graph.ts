import { forceCollide } from "d3-force";
import type ForceGraph from "force-graph";
import ForceGraphCtor from "force-graph";
import { getCssVariable } from "../../utils/style.ts";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	PhysicsParams,
	RendererFunction,
} from "../graph-types.ts";

/**
 * Render or update a graph using force-graph.
 *
 * @param nodes - Graph nodes to render
 * @param edges - Graph links to render
 * @param _layout - Layout algorithm (unused)
 * @param container - Target element for rendering
 * @param existing - Existing force-graph instance to update
 * @param nodeSize - Display size for nodes
 * @param labelScale - Relative scale for labels
 * @param showLabels - Whether to display labels
 * @param physicsParams - Physics simulation parameters
 * @returns The force-graph instance used for rendering
 */
const renderForceGraph: RendererFunction = (
	nodes: GraphNode[],
	edges: GraphLink[],
	_layout: Layout,
	container: HTMLElement,
	existing: GraphInstance | undefined | Record<string, unknown>,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
	physicsParams: PhysicsParams,
): GraphInstance => {
	const radius = nodeSize / 2;
	const area = Math.PI * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: area }));
	let fg = existing as ForceGraph<GraphNode, GraphLink> | undefined;
	if (!fg) fg = new ForceGraphCtor<GraphNode, GraphLink>(container);
	const fontSize = 36 * labelScale;
	fg.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2);

	fg.d3Force("charge")?.strength(physicsParams.chargeStrength);
	fg.d3Force("link")?.distance(physicsParams.linkDistance);
	fg.d3Force("center")?.strength(physicsParams.centerForce);
	fg.d3AlphaDecay(physicsParams.alphaDecay);
	fg.d3VelocityDecay(physicsParams.velocityDecay);
	fg.warmupTicks(physicsParams.warmupTicks);
	if (physicsParams.collisionEnabled) {
		fg.d3Force("collision", forceCollide(physicsParams.collisionRadius));
	} else {
		fg.d3Force("collision", null);
	}

	if (existing) {
		const prev = fg.graphData();
		const posMap = new Map(prev.nodes.map((n) => [n.id, n]));
		fgNodes.forEach((n) => {
			const p = posMap.get(n.id);
			if (p?.x !== undefined) {
				n.x = p.x;
				if (p.y !== undefined) n.y = p.y;
				if (p.vx !== undefined) n.vx = p.vx;
				if (p.vy !== undefined) n.vy = p.vy;
			}
		});
	}

	fg.graphData({ nodes: fgNodes, links: edges });
	if (existing) {
		fg.d3ReheatSimulation();
	}

	if (showLabels) {
		fg.nodeCanvasObject((node: GraphNode, ctx, scale) => {
			const label = String(node.label);
			const size = fontSize / scale;
			ctx.font = `${size}px ${getCssVariable("--bs-font-sans-serif")}`;
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			ctx.fillStyle = getCssVariable("--bs-body-color");
			if (typeof node.x === "number" && typeof node.y === "number") {
				ctx.fillText(label, node.x, node.y + radius + 2);
			}
		}).nodeCanvasObjectMode(() => "after");
	} else {
		fg.nodeCanvasObject(() => undefined).nodeCanvasObjectMode(() => "after");
	}

	return fg;
};

export default renderForceGraph;
