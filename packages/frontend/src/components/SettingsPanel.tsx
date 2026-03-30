import { useId } from "react";
import type {
	Layout,
	PhysicsParams,
	Renderer,
	Theme,
} from "../graph/graph-types.ts";
import { Button } from "./ui/Button.tsx";
import { FormGroup } from "./ui/FormGroup.tsx";
import { RangeSlider } from "./ui/RangeSlider.tsx";
import { Select } from "./ui/Select.tsx";
import { Switch } from "./ui/Switch.tsx";
import { When } from "./ui/When.tsx";

interface SettingsPanelProps {
	open: boolean;
	readonly themes: readonly { readonly value: Theme; readonly label: string }[];
	readonly renderers: readonly {
		readonly value: Renderer;
		readonly label: string;
	}[];
	readonly layouts: readonly Layout[];
	theme: Theme;
	renderer: Renderer;
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	showLabels: boolean;
	physicsParams: PhysicsParams;
	onThemeChange: (theme: Theme) => void;
	onRendererChange: (renderer: Renderer) => void;
	onLayoutChange: (layout: Layout) => void;
	onNodeSizeChange: (size: number) => void;
	onLabelScaleChange: (scale: number) => void;
	onShowLabelsChange: (show: boolean) => void;
	onPhysicsParamsChange: (params: Partial<PhysicsParams>) => void;
	onClose: () => void;
}

export function SettingsPanel({
	open,
	themes,
	renderers,
	layouts,
	theme,
	renderer,
	layout,
	nodeSize,
	labelScale,
	showLabels,
	physicsParams,
	onThemeChange,
	onRendererChange,
	onLayoutChange,
	onNodeSizeChange,
	onLabelScaleChange,
	onShowLabelsChange,
	onPhysicsParamsChange,
	onClose,
}: SettingsPanelProps) {
	const panelId = useId();
	const labelId = useId();
	const showLabelsSwitchId = useId();
	const collisionSwitchId = useId();

	return (
		<div
			id={panelId}
			className={`offcanvas offcanvas-start ${open ? "show" : ""}`}
			tabIndex={-1}
			role="dialog"
			aria-labelledby={labelId}
		>
			<div className="offcanvas-header">
				<h4 id={labelId} className="offcanvas-title">
					<i className="bi bi-gear-fill"></i> Settings
				</h4>
				<Button variant="close" aria-label="Close" onClick={onClose} />
			</div>
			<div className="offcanvas-body">
				<FormGroup label="Theme">
					<Select
						value={theme}
						options={themes}
						onChange={(value) => onThemeChange(value as Theme)}
					/>
				</FormGroup>

				<FormGroup label="Renderer">
					<Select
						value={renderer}
						options={renderers}
						onChange={(value) => onRendererChange(value as Renderer)}
					/>
				</FormGroup>

				<When condition={renderer === "cytoscape"}>
					<FormGroup label="Layout">
						<Select
							value={layout}
							options={layouts}
							onChange={(value) => onLayoutChange(value as Layout)}
						/>
					</FormGroup>
				</When>

				<RangeSlider
					label="Node size"
					value={nodeSize}
					min={5}
					max={30}
					onChange={onNodeSizeChange}
					unit="px"
				/>

				<When condition={renderer !== "3d-force-graph"}>
					<RangeSlider
						label="Font size"
						value={labelScale}
						min={0.3}
						max={1.5}
						step={0.1}
						onChange={onLabelScaleChange}
						unit="em"
						formatter={(v) => v.toFixed(1)}
					/>
				</When>

				<When condition={renderer !== "3d-force-graph"}>
					<FormGroup label="Show labels">
						<Switch
							id={showLabelsSwitchId}
							checked={showLabels}
							onChange={onShowLabelsChange}
							label="Display labels"
						/>
					</FormGroup>
				</When>

				<When
					condition={
						renderer === "force-graph" || renderer === "3d-force-graph"
					}
				>
					<RangeSlider
						label="Charge strength"
						value={physicsParams.chargeStrength}
						min={-500}
						max={0}
						step={10}
						onChange={(v) => onPhysicsParamsChange({ chargeStrength: v })}
					/>
					<RangeSlider
						label="Link distance"
						value={physicsParams.linkDistance}
						min={10}
						max={500}
						step={10}
						onChange={(v) => onPhysicsParamsChange({ linkDistance: v })}
						unit="px"
					/>
					<RangeSlider
						label="Center force"
						value={physicsParams.centerForce}
						min={0}
						max={1}
						step={0.01}
						onChange={(v) => onPhysicsParamsChange({ centerForce: v })}
						formatter={(v) => v.toFixed(2)}
					/>
					<RangeSlider
						label="Alpha decay"
						value={physicsParams.alphaDecay}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={(v) => onPhysicsParamsChange({ alphaDecay: v })}
						formatter={(v) => v.toFixed(3)}
					/>
					<RangeSlider
						label="Velocity decay"
						value={physicsParams.velocityDecay}
						min={0.1}
						max={0.9}
						step={0.1}
						onChange={(v) => onPhysicsParamsChange({ velocityDecay: v })}
						formatter={(v) => v.toFixed(1)}
					/>
					<RangeSlider
						label="Warmup ticks"
						value={physicsParams.warmupTicks}
						min={0}
						max={500}
						step={10}
						onChange={(v) => onPhysicsParamsChange({ warmupTicks: v })}
					/>
					<FormGroup label="Collision detection">
						<Switch
							id={collisionSwitchId}
							checked={physicsParams.collisionEnabled}
							onChange={(v) => onPhysicsParamsChange({ collisionEnabled: v })}
							label="Enable collision force"
						/>
					</FormGroup>
					<When condition={physicsParams.collisionEnabled}>
						<RangeSlider
							label="Collision radius"
							value={physicsParams.collisionRadius}
							min={1}
							max={50}
							step={1}
							onChange={(v) => onPhysicsParamsChange({ collisionRadius: v })}
							unit="px"
						/>
					</When>
				</When>

				<When condition={renderer === "cytoscape" && layout === "fcose"}>
					<RangeSlider
						label="Node repulsion"
						value={physicsParams.fcoseNodeRepulsion ?? 4500}
						min={100}
						max={20000}
						step={100}
						onChange={(v) => onPhysicsParamsChange({ fcoseNodeRepulsion: v })}
					/>
					<RangeSlider
						label="Ideal edge length"
						value={physicsParams.fcoseIdealEdgeLength ?? 50}
						min={10}
						max={200}
						step={5}
						onChange={(v) => onPhysicsParamsChange({ fcoseIdealEdgeLength: v })}
						unit="px"
					/>
					<RangeSlider
						label="Gravity"
						value={physicsParams.fcoseGravity ?? 0.25}
						min={0}
						max={1}
						step={0.01}
						onChange={(v) => onPhysicsParamsChange({ fcoseGravity: v })}
						formatter={(v) => v.toFixed(2)}
					/>
				</When>
			</div>
		</div>
	);
}
