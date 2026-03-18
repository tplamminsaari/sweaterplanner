# sweaterplanner

## Overal description
A tool for planning Icelandic sweaters. There are 3 main panels.

### Yarn catalog
There is a yarn catalog, from where user can select different type of yarns and colors. User can select yarns from different brands (like Istex and Novita).

After selecting yarn brand, user can select type of yarn. E.g. Lettlopi and Wonder Wool DK.

And after selecting the yarn type, there is color palette showing all yarn colors that are available.

Eventually these yarns can be downloaded from backend, but at first phase it is ok to have small hardcoded yarn collection in code.

User can select up to 5 different yarns for the shirt from the yarn catalog.

### Pattern designer
In the middle section of the screen there is the knitting pattern designer tool. User can design different patterns for
- Shirt tail. Pattern size from 4x13 to 8x26.
- Sleeve openings. Pattern size from 4x13 to 8x26.
- Yoke. Pattern size 12x56 to 24x56.

User can select the size of the pattern for each part of the shirt.

The pattern designer is like a drawing application, where user can place different colors to the grid. Each sell in grid representsa stitch in the sweater.

### Sweater preview pane
The preview pane shows 2D preview of the sweater. It renders the sweater and does texture mapping of the designed patters to the right locations of the shirt.

The basic structure of the sweater from top to bottom is:
- Ribbing knit around neckhole. Height of 5cm.
- Yoke, based on the pattern. Top of the yoke is narrower than the bottom part of the yoke. This means that pattern will have less stitches on upper part than on lower part.
- The base of the shirt in single color.
- Bottom pattern for shirt's tail.
- Ribbing knit at the end of shirt tail.

The sleeves will have structure:
- Base of the sleeve in single color. Gradually getting slightly norrower when aproaching the sleeve opening.
- Pattern for the sleeve opening.
- Ribbing knit around the sleeve opening. Left 5cm.

## Other things
The tool will estimate the amount of yarn is needed based on yarn density.

There will be downloadable knitting instructions. This is mostly based on template that will just updated with the yarns selected for the sweater.