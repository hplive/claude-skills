// Template: redraw a mark in CoreGraphics from SVG geometry and export transparent PNGs.
// The shapes below are a neutral placeholder (disc with a ring cut-out and an accent dot): replace them.
// Usage: xcrun swift render_mark.swift <output-folder>
import AppKit
import CoreGraphics

func rgb(_ hex: UInt32) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}
let paper = rgb(0xF2F2F0), accent = rgb(0xFF3B30)

/// `viewBox` is the SVG viewBox (x, y, w, h). Output keeps its aspect ratio at the given pixel width.
func draw(width: Int, accentDot: Bool, to path: String) {
    let vb = (x: CGFloat(0), y: CGFloat(0), w: CGFloat(1000), h: CGFloat(1000))
    let scale = CGFloat(width) / vb.w
    let height = Int((vb.h * scale).rounded())
    let ctx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.translateBy(x: 0, y: CGFloat(height))   // SVG origin is top-left
    ctx.scaleBy(x: scale, y: -scale)
    ctx.translateBy(x: -vb.x, y: -vb.y)

    func circle(_ cx: CGFloat, _ cy: CGFloat, _ r: CGFloat) -> CGRect { CGRect(x: cx - r, y: cy - r, width: 2 * r, height: 2 * r) }

    ctx.setFillColor(paper); ctx.fillEllipse(in: circle(500, 500, 400))      // 1. solid shape
    ctx.setBlendMode(.clear)                                                  // 2. cut-outs
    ctx.setLineWidth(16); ctx.strokeEllipse(in: circle(500, 500, 260))
    ctx.fillEllipse(in: circle(500, 500, 60))
    ctx.setBlendMode(.normal)                                                 // 3. accent on the meaningful point
    ctx.setFillColor(accentDot ? accent : paper); ctx.fillEllipse(in: circle(700, 380, 44))

    let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}

let out = CommandLine.arguments[1]
draw(width: 480, accentDot: true, to: out + "/Mark@3x.png")        // splash / launch screen
draw(width: 360, accentDot: false, to: out + "/MarkMono@3x.png")   // complication (one colour)
print("ok")
