import pptxgen from "pptxgenjs";
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
const slide = pres.addSlide();
slide.addText("矢印テスト", {
  x: 1, y: 1, w: 3, h: 0.5,
  shape: pres.ShapeType.homePlate,
  fill: { color: "001CAD" },
  fontSize: 14, bold: true, color: "FFFFFF",
  align: "center", valign: "middle",
});
await pres.writeFile({ fileName: "test_shape_text.pptx" });
console.log("done");
