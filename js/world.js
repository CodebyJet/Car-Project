class World {
  constructor(
    graph,
    roadWidth = 100,
    roadRoundness = 10,
    buildingWidth = 150,
    buidlingMinLength = 150,
    spacing = 50
  ) {
    this.graph = graph;
    this.roadWidth = roadWidth;
    this.roadRoundness = roadRoundness;
    this.buildingWidth = buildingWidth;
    this.buidlingMinLength = buidlingMinLength;
    this.spacing = spacing;

    this.envelopes = [];
    this.roadBorders = [];
    this.buildings = [];
    this.trees = [];

    this.generate();
  }

  generate() {
    this.envelopes.length = 0;
    for (const seg of this.graph.segments) {
      this.envelopes.push(
        new Envelope(seg, this.roadWidth, this.roadRoundness)
      );
    }
    this.roadBorders = Polygon.union(this.envelopes.map((e) => e.poly));
    this.buildings = this.#generateBuildings();
    this.trees = this.#generateTrees();
  }

  #generateTrees(count = 10) {
    const roadBorderPoints = this.roadBorders.map((s) => [s.p1, s.p2]).flat();
    const buildingPoints = this.buildings.flatMap((b) => b.points);
  
    const points = [...new Set([...roadBorderPoints, ...buildingPoints])];
  
    const left = Math.min(...points.map((p) => p.x));
    const right = Math.max(...points.map((p) => p.x));
    const top = Math.min(...points.map((p) => p.y));
    const bottom = Math.max(...points.map((p) => p.y));

    const illegalPolys = [
      ...this.buildings,
      ...this.envelopes.map((e) => e.poly)
    ]
  
    const trees = [];
    while (trees.length < count) {
      const p = new Point(
        lerp(left, right, Math.random()),
        lerp(bottom, top, Math.random())
      );
      let keep = true;
      for (const poly of illegalPolys){
        if (poly.containsPoint(p)){
          keep = false;
          break;
        }
      }
      if (keep){
        trees.push(p);
      }
    }
  
    return trees;
  }
  
  #generateBuildings() {
    const tmpEnvelopes = [];
    for (const seg of this.graph.segments) {
      tmpEnvelopes.push(
        new Envelope(
          seg,
          this.roadWidth + this.buildingWidth + this.spacing * 2,
          this.roadRoundness
        )
      );
    }

    const guides = Polygon.union(tmpEnvelopes.map((e) => e.poly));

    for (let i = 0; i < guides.length; i++) {
      const seg = guides[i];
      if (seg.length() < this.buidlingMinLength) {
        guides.splice(i, 1);
        i--;
      }
    }

    const supports = [];
    for (let seg of guides) {
      const len = seg.length() + this.spacing;
      const buildingCount = Math.floor(
        len / (this.buidlingMinLength + this.spacing)
      );
      const buidlingLength = len / buildingCount - this.spacing;

      const dir = seg.directionVector();

      let q1 = seg.p1;
      let q2 = add(q1, scale(dir, buidlingLength));
      supports.push(new Segment(q1, q2));

      for (let i = 2; i <= buildingCount; i++) {
        q1 = add(q2, scale(dir, this.spacing));
        q2 = add(q1, scale(dir, buidlingLength));
        supports.push(new Segment(q1, q2));
      }
    }

    const bases = [];
    for (const seg of supports) {
      bases.push(new Envelope(seg, this.buildingWidth).poly);
    }

    for (let i = 0; i < bases.length - 1; i++) {
      for (let j = i + 1; j < bases.length; j++) {
        if (bases[i].intersectsPoly(bases[j])) {
          bases.splice(j, 1);
          j--;
        }
      }
    }

    return bases;
  }

  draw(ctx) {
    for (const env of this.envelopes) {
      env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
    }
    for (const seg of this.graph.segments) {
      seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
    }
    for (const seg of this.roadBorders) {
      seg.draw(ctx, { color: "white", width: 4 });
    }

    for (const tree of this.trees) {
      tree.draw(ctx);
    }
    for (const bld of this.buildings) {
      bld.draw(ctx);
    }
  }
}
