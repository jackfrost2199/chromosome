# Chromosome Display Plugin

Chromosome radial display.  Shows size of chromosomes, level of variations and individual SNVs.

This is a javascript plugin that allows a display of variations on a genome split by chromosomes.  The size of the radial chromosomes relate to their actual proportional size.  The height of each chromosome segment relates to the number of variations found in the chromosome and individual SNVs are annotated with bars at their approximate location.

TO DO
------
- [ ] Allow csvchrom and csvsnp strings to have spaces (strip spaces from strings).
- [ ] Allow use of protected reference identifiers in csvchrom and csvsnp
- [ ] csvsnp should start with Reference ID and not position.
- [ ] Allow csvsnp and csvchrom to be directly passed as JSON (currently converts internally from CSV to JS Object)
- [ ] Determine height/width variable hard limits if applicable

TO USE
------

To draw genome radial display, use the function:

  defineSegments(int innerRadius, int canvas_width, int canvas_height, string csvchrom, string csvsnp)

which is defined in the segment.js file.  The parameters of the function are as follows:

  innerRadius - This is an integer that defines the radius of the inner section of the donut shape.
  canvas_height - This is the height of the canvas of the plugin in pixels.
  canvas_width - This is the width of the canvas of the plugin in pixels.
  csvchrom - This is a csv file (i.e. a string in CSV format) that requires the columns:
				Reference Name (string), Size (int/double), SNV Percent (decimal)
			Currently this variable does not allow spaces and should have the line deliminators (\n)s.
  csvsnp - This is a csv file (i.e. a string in CSV format) that requires the columns:
				Location (chromosomal position - integer/double), Reference Name (string), Reference Nucleotide (A/T/C/G), Variation Nucleotide (A/T/C/G), Coverage (integer)
				

An example use of the display is provided in chromosome-display-example.html with dummy data.