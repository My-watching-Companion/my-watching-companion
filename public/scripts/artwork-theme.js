document.addEventListener("DOMContentLoaded", function () {
  const defaultColor = [247, 56, 74]; // Default pink color
  const posterImage = document.querySelector(".artwork-header img");

  function calculateLuminance(r, g, b) {
    // sRGB luminance formula
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function applyTheme(color) {
    try {
      const minIntensity = 30; // Minimum RGB value to ensure visibility
      color = color.map((c) => Math.max(c, minIntensity));

      const root = document.documentElement;
      const luminance = calculateLuminance(color[0], color[1], color[2]);

      // Calculate shadow opacity and saturation boost for light colors
      const shadowOpacity = Math.max(0.3, Math.min(0.6, 0.7 - luminance));

      // Boost color saturation for shadows if the color is very light
      let shadowColor;
      if (luminance > 0.7) {
        // For light colors, make shadows more saturated by reducing all components except the dominant one
        const maxComponent = Math.max(...color);
        const saturationBoost = color.map((c) =>
          c === maxComponent ? c : Math.max(0, c - luminance * 100)
        );
        shadowColor = saturationBoost.join(",");
      } else {
        shadowColor = color.join(",");
      }

      // Set theme colors
      root.style.setProperty("--artwork-color", `rgb(${color.join(",")})`);
      root.style.setProperty("--artwork-color-rgb", shadowColor);
      root.style.setProperty("--shadow-opacity", shadowOpacity);

      // Calculate lighter and darker variants
      const lighterColor = color.map((c) => Math.min(255, c + 40));
      const darkerColor = color.map((c) => Math.max(0, c - 40));

      root.style.setProperty(
        "--artwork-color-light",
        `rgb(${lighterColor.join(",")})`
      );
      root.style.setProperty(
        "--artwork-color-dark",
        `rgb(${darkerColor.join(",")})`
      );

      // Set text color based on luminance
      const textColor = luminance > 0.5 ? "#1a1a1a" : "#ffffff";
      root.style.setProperty("--artwork-text-color", textColor);

      console.log(
        "Theme applied successfully:",
        color,
        "Shadow color:",
        shadowColor,
        "Shadow opacity:",
        shadowOpacity
      );
    } catch (error) {
      console.error("Error applying theme:", error);
      applyTheme(defaultColor);
    }
  }

  function initializeColorThief() {
    try {
      const colorThief = new ColorThief();

      if (posterImage.complete) {
        console.log("Image already loaded, extracting color...");
        const color = colorThief.getColor(posterImage);
        applyTheme(color);
      } else {
        console.log("Waiting for image to load...");
        posterImage.addEventListener("load", function () {
          console.log("Image loaded, extracting color...");
          const color = colorThief.getColor(posterImage);
          applyTheme(color);
        });
      }

      posterImage.addEventListener("error", function () {
        console.error("Error loading image, using default color");
        applyTheme(defaultColor);
      });
    } catch (error) {
      console.error("Error initializing ColorThief:", error);
      applyTheme(defaultColor);
    }
  }

  // Initialize after a small delay to ensure image is properly loaded
  setTimeout(initializeColorThief, 100);
});
