# Open-source attribution

The interlace tracing model in `js/knot.js` is an adaptation of the crossing, break, trace and redraw-overpass method in [Celtic Knot Maker](https://github.com/evoluteur/celtic-knot-maker) by Olivier Giulieri. The implementation was redesigned for random mixed-media ornaments, transformed and distorted shapes, and the host site's export and styling architecture. The underlying weave construction follows George Bain's *Celtic Art: The Methods of Construction*.

The upstream project is released under the following MIT License:

MIT License

Copyright (c) 2026 Olivier Giulieri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Optional color mixing: [Spectral.js](https://github.com/rvanwijnen/spectral.js). The source is not bundled or loaded by this page; the color helper can use it if it is provided by the host.


### Botanical growth methods

The new flat foliate vines and leaf paths are original procedural drawings, informed by the supplied manuscript images and procedural vegetation resources. They do not include source from the linked tree generation projects.

### Other reviewed sources (no third-party code incorporated)

- [VegetationGeneratorThreeJS](https://github.com/achrefelouafi/VegetationGeneratorThreeJS): stroke-guided vine growth and tangent branching; concept adapted to original 2D strokes.
- [VineJS](https://github.com/millerthegorilla/vinejs): procedural winding and branching parameter concepts.
- [dmackinnon1/celtic](https://github.com/dmackinnon1/celtic): alternative grid knot editor and display ideas.
- [Rune.js](https://github.com/runemadsen/rune.js) and [Runicjs](https://github.com/batman-nair/Runicjs): programmatic vector drawing and glyph construction references.
- [Illustrated Manuscript](https://github.com/dengshu2/illustrated-manuscript): manuscript display references only; no drag-and-drop text engine or artwork copied. Its dragon art, game logic and Pretext source are not bundled.
- [Stained Glass Generator](https://github.com/joecooper1/stained-glass-generator): noise, color groupings and mosaic-size controls as inspiration, but not used as a library.

These sources do not have to be installed; there is no corresponding code redistribution.
