# Adaptive layout for iPhone Duo

Practice uses UIKit reserved regions to keep two-hand tap areas, rhythm symbols, score notation, the beat counter, and the next-pattern preview clear of the hinge and front-camera cutouts on iOS 27.1 and later. The practice layout follows the current hinge orientation: left and right panels for a vertical division, or upper and lower panels for a horizontal division. One-hand visuals stay in their selected panel while the tap target remains full screen.

The native `SplitBeatDeviceLayout` module observes `UIHingeInteraction` changes and reports active division and occlusion frames in points. JavaScript scales those frames to the app window, reserves top-edge camera space, and recomputes the layout when the window changes. Earlier iOS versions fall back to an even split based on the current orientation.

The app permits portrait and landscape orientation and does not require fullscreen. Other screens continue to use their existing responsive layouts; practice is the screen that currently responds directly to Duo hinge geometry.

Settings keeps its section navigation available on narrow iPhone screens without squeezing the setting controls into a narrow side column. Below 640 points of width, it places a horizontally scrollable section selector below the back header and gives the selected page the full content width. Wider layouts keep the vertical sidebar. The page content scrolls independently of the section selector and any pinned start action.
