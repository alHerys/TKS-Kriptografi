/**
 * @typedef {{phase: 'prepare'|'process'|'result', kind: string, title: string,
 * explanation: string, data: Object, output: string}} Step
 * @typedef {{algorithm: string, mode: string, input: string, normalized_text: string,
 * key: string|number, normalized_key: string|number, output: string,
 * notes: string[], steps: Step[]}} Run
 * @typedef {{x:number, y:number}} Point
 * @typedef {{id:string, x:number, y:number, text:string, role?:string,
 * label?:string, reveal?:boolean, width?:number}} Cell
 * @typedef {{text:string, from:Point, to:Point, via?:Point[]}} Mover
 * @typedef {{width:number, height:number, cells:Cell[], movers:Mover[],
 * labels:Object[], outlines?:Object[], formula?:string}} Scene
 */
export {};
