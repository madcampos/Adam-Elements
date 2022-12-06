/* eslint-disable @typescript-eslint/no-magic-numbers */

interface BorderMeasurements {
	top: number,
	right: number,
	bottom: number,
	left: number,
	stroke: number,
	radius: number,
	spacing: number
}

export function setBorders(root: ShadowRoot, { top, right, bottom, left, stroke, radius, spacing }: BorderMeasurements): void {
	const padding = stroke + spacing;

	const inputRadius = radius;
	const innerRadius = inputRadius + padding;
	const outerRadius = innerRadius + padding;

	const leftEnd = left + outerRadius;
	const rightEnd = right - outerRadius;
	const topEnd = top + outerRadius;
	const bottomEnd = bottom - outerRadius;

	// #region Outer border
	root.querySelector<SVGPathElement>('#borders-svg #outer-border-top-left')?.setAttribute('d', `
		M ${left} ${topEnd}
		A ${outerRadius} ${outerRadius} 0 0 1 ${leftEnd} ${top}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #outer-border-top-right')?.setAttribute('d', `
		M ${rightEnd} ${top}
		A ${outerRadius} ${outerRadius} 0 0 1 ${right} ${topEnd}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #outer-border-bottom-right')?.setAttribute('d', `
		M ${right} ${bottomEnd}
		A ${outerRadius} ${outerRadius} 0 0 1 ${rightEnd} ${bottom}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #outer-border-bottom-left')?.setAttribute('d', `
		M ${leftEnd} ${bottom}
		A ${outerRadius} ${outerRadius} 0 0 1 ${left} ${bottomEnd}
	`);

	root.querySelector<SVGLineElement>('#borders-svg #outer-border-top')?.setAttribute('x1', `${leftEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-top')?.setAttribute('x2', `${rightEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-top')?.setAttribute('y1', `${top}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-top')?.setAttribute('y2', `${top}`);

	root.querySelector<SVGLineElement>('#borders-svg #outer-border-right')?.setAttribute('x1', `${right}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-right')?.setAttribute('x2', `${right}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-right')?.setAttribute('y1', `${topEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-right')?.setAttribute('y2', `${bottomEnd}`);

	root.querySelector<SVGLineElement>('#borders-svg #outer-border-bottom')?.setAttribute('x1', `${rightEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-bottom')?.setAttribute('x2', `${leftEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-bottom')?.setAttribute('y1', `${bottom}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-bottom')?.setAttribute('y2', `${bottom}`);

	root.querySelector<SVGLineElement>('#borders-svg #outer-border-left')?.setAttribute('x1', `${left}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-left')?.setAttribute('x2', `${left}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-left')?.setAttribute('y1', `${bottomEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #outer-border-left')?.setAttribute('y2', `${topEnd}`);
	// #endregion

	// #region Inner border
	root.querySelector<SVGPathElement>('#borders-svg #inner-border-top-left')?.setAttribute('d', `
		M ${left + padding} ${topEnd}
		A ${innerRadius} ${innerRadius} 0 0 1 ${leftEnd} ${top + padding}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #inner-border-top-right')?.setAttribute('d', `
		M ${rightEnd} ${top + padding}
		A ${innerRadius} ${innerRadius} 0 0 1 ${right - padding} ${topEnd}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #inner-border-bottom-right')?.setAttribute('d', `
		M ${right - padding} ${bottomEnd}
		A ${innerRadius} ${innerRadius} 0 0 1 ${rightEnd} ${bottom - padding}
	`);

	root.querySelector<SVGPathElement>('#borders-svg #inner-border-bottom-left')?.setAttribute('d', `
		M ${leftEnd} ${bottom - padding}
		A ${innerRadius} ${innerRadius} 0 0 1 ${left + padding} ${bottomEnd}
	`);

	root.querySelector<SVGLineElement>('#borders-svg #inner-border-top')?.setAttribute('x1', `${leftEnd + padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-top')?.setAttribute('x2', `${rightEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-top')?.setAttribute('y1', `${top + padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-top')?.setAttribute('y2', `${top + padding}`);

	root.querySelector<SVGLineElement>('#borders-svg #inner-border-right')?.setAttribute('x1', `${right - padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-right')?.setAttribute('x2', `${right - padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-right')?.setAttribute('y1', `${topEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-right')?.setAttribute('y2', `${bottomEnd}`);

	root.querySelector<SVGLineElement>('#borders-svg #inner-border-bottom')?.setAttribute('x1', `${rightEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-bottom')?.setAttribute('x2', `${leftEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-bottom')?.setAttribute('y1', `${bottom - padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-bottom')?.setAttribute('y2', `${bottom - padding}`);

	root.querySelector<SVGLineElement>('#borders-svg #inner-border-left')?.setAttribute('x1', `${left + padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-left')?.setAttribute('x2', `${left + padding}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-left')?.setAttribute('y1', `${bottomEnd}`);
	root.querySelector<SVGLineElement>('#borders-svg #inner-border-left')?.setAttribute('y2', `${topEnd}`);
	// #endregion

	// #region Input
	root.querySelector<SVGRectElement>('#borders-svg #input-background')?.setAttribute('x', `${left + (padding * 2)}`);
	root.querySelector<SVGRectElement>('#borders-svg #input-background')?.setAttribute('y', `${top + (padding * 2)}`);

	root.querySelector<SVGRectElement>('#borders-svg #input-background')?.setAttribute('width', `${rightEnd - left - padding}`);
	root.querySelector<SVGRectElement>('#borders-svg #input-background')?.setAttribute('height', `${bottomEnd - top - padding}`);
	root.querySelector<SVGRectElement>('#borders-svg #input-background')?.setAttribute('rx', `${inputRadius}`);
	// #endregion

	// #region Attention Marker
	root.querySelector<SVGCircleElement>('#borders-svg #outer-attention-marker')?.setAttribute('cx', `${leftEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #outer-attention-marker')?.setAttribute('cy', `${topEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #outer-attention-marker')?.setAttribute('r', `${padding}`);

	root.querySelector<SVGCircleElement>('#borders-svg #inner-attention-marker')?.setAttribute('cx', `${leftEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #inner-attention-marker')?.setAttribute('cy', `${topEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #inner-attention-marker')?.setAttribute('r', `${stroke}`);

	root.querySelector<SVGCircleElement>('#borders-svg #attention-marker-mask circle')?.setAttribute('cx', `${leftEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #attention-marker-mask circle')?.setAttribute('cy', `${topEnd - (padding * 2)}`);
	root.querySelector<SVGCircleElement>('#borders-svg #attention-marker-mask circle')?.setAttribute('r', `${padding * 2}`);
	// #endregion
}
