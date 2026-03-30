import type { Core, LayoutOptions } from "cytoscape";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { getCssVariable } from "../../utils/style.ts";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	PhysicsParams,
	RendererFunction,
} from "../graph-types.ts";

cytoscape.use(fcose);

/**
 * Render or update a graph using Cytoscape.
 *
 * @param nodes - Graph nodes to render
 * @param edges - Graph links to render
 * @param layout - Layout algorithm name
 * @param container - Target element for rendering
 * @param existing - Existing Cytoscape instance to update
 * @param nodeSize - Display size for nodes
 * @param labelScale - Relative scale for labels
 * @param showLabels - Whether to display labels
 * @param physicsParams - Physics simulation parameters (fcose fields used when layout === 'fcose')
 * @returns The Cytoscape instance used for rendering
 */
const renderCytoscape: RendererFunction = (
	nodes: GraphNode[],
	edges: GraphLink[],
	layout: Layout,
	container: HTMLElement,
	existing: GraphInstance | undefined | Record<string, unknown>,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
	physicsParams: PhysicsParams,
): GraphInstance => {
	const elements = [
		...nodes.map((n) => ({ data: n })),
		...edges.map((e) => ({ data: e })),
	];

	const style = [
		{ selector: "edge", style: { width: 1 } },
		{
			selector: "node",
			style: {
				width: nodeSize,
				height: nodeSize,
				"font-size": `${labelScale}em`,
				label: showLabels ? "data(label)" : "",
				"font-family": getCssVariable("--bs-font-sans-serif"),
				color: getCssVariable("--bs-body-color"),
				"background-color": "data(color)",
			},
		},
	];

	const cyLayout = {
		name: layout,
		tile: false,
		animate: "end",
		...(layout === "fcose" && {
			nodeRepulsion: physicsParams.fcoseNodeRepulsion ?? 4500,
			idealEdgeLength: physicsParams.fcoseIdealEdgeLength ?? 50,
			gravity: physicsParams.fcoseGravity ?? 0.25,
			quality: "draft",
		}),
	} as LayoutOptions;

	const cyExisting = existing as Core | undefined;

	if (!cyExisting) {
		return cytoscape({
			container,
			elements,
			layout: cyLayout,
			minZoom: 0.5,
			maxZoom: 4,
			style,
		});
	}

	cyExisting.batch(() => {
		cyExisting.elements().remove();
		cyExisting.add(elements);
		cyExisting.style(style);
		cyExisting.layout(cyLayout).run();
	});

	return cyExisting;
};

export default renderCytoscape;
