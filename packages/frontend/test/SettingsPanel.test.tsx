import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "../src/components/SettingsPanel.tsx";
import { Layouts, Renderers, Themes } from "../src/graph/graph-types.ts";

const defaultPhysicsParams = {
	chargeStrength: -150,
	linkDistance: 100,
	centerForce: 0.05,
	alphaDecay: 0.0228,
	velocityDecay: 0.4,
	warmupTicks: 100,
	collisionEnabled: false,
	collisionRadius: 5,
	fcoseNodeRepulsion: 4500,
	fcoseIdealEdgeLength: 50,
	fcoseGravity: 0.25,
};

describe("SettingsPanel", () => {
	afterEach(() => {
		cleanup();
	});
	it("renders the settings panel and handles close", () => {
		const handleClose = vi.fn();
		const handleChange = vi.fn();

		render(
			<SettingsPanel
				open={true}
				themes={Themes}
				renderers={Renderers}
				layouts={Layouts}
				theme="dark"
				renderer="force-graph"
				layout="cose"
				nodeSize={10}
				labelScale={1}
				showLabels={true}
				physicsParams={defaultPhysicsParams}
				onThemeChange={handleChange}
				onRendererChange={handleChange}
				onLayoutChange={handleChange}
				onNodeSizeChange={handleChange}
				onLabelScaleChange={handleChange}
				onShowLabelsChange={handleChange}
				onPhysicsParamsChange={handleChange}
				onClose={handleClose}
			/>,
		);

		expect(screen.getByText("Settings")).toBeInTheDocument();

		const closeButton = screen.getByLabelText("Close");
		fireEvent.click(closeButton);
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it("renders physics sliders for force-graph renderer", () => {
		const handleChange = vi.fn();
		render(
			<SettingsPanel
				open={true}
				themes={Themes}
				renderers={Renderers}
				layouts={Layouts}
				theme="dark"
				renderer="force-graph"
				layout="cose"
				nodeSize={10}
				labelScale={1}
				showLabels={true}
				physicsParams={defaultPhysicsParams}
				onThemeChange={handleChange}
				onRendererChange={handleChange}
				onLayoutChange={handleChange}
				onNodeSizeChange={handleChange}
				onLabelScaleChange={handleChange}
				onShowLabelsChange={handleChange}
				onPhysicsParamsChange={handleChange}
				onClose={handleChange}
			/>,
		);
		expect(screen.getByText("Charge strength")).toBeInTheDocument();
		expect(screen.getByText("Link distance")).toBeInTheDocument();
		expect(screen.getByText("Warmup ticks")).toBeInTheDocument();
	});

	it("renders fcose sliders for cytoscape renderer with fcose layout", () => {
		const handleChange = vi.fn();
		render(
			<SettingsPanel
				open={true}
				themes={Themes}
				renderers={Renderers}
				layouts={Layouts}
				theme="dark"
				renderer="cytoscape"
				layout="fcose"
				nodeSize={10}
				labelScale={1}
				showLabels={true}
				physicsParams={defaultPhysicsParams}
				onThemeChange={handleChange}
				onRendererChange={handleChange}
				onLayoutChange={handleChange}
				onNodeSizeChange={handleChange}
				onLabelScaleChange={handleChange}
				onShowLabelsChange={handleChange}
				onPhysicsParamsChange={handleChange}
				onClose={handleChange}
			/>,
		);
		expect(screen.getByText("Node repulsion")).toBeInTheDocument();
		expect(screen.getByText("Ideal edge length")).toBeInTheDocument();
		expect(screen.getByText("Gravity")).toBeInTheDocument();
	});
});
