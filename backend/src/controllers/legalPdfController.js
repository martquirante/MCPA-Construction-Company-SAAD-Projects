const { generateLegalPdf } = require("../services/legalPdfService");

/**
 * Controller to handle legal PDF downloads with automatic filenames
 */
async function downloadLegalPdf(req, res) {
  try {
    const docType = (req.params.docType || "privacy").toLowerCase();
    const lang = (req.query.lang || "en").toLowerCase();

    const { buffer, filename } = await generateLegalPdf(docType, lang);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.send(buffer);
  } catch (err) {
    console.error("[Legal PDF Controller] Error generating document:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate legal PDF: " + err.message,
    });
  }
}

module.exports = {
  downloadLegalPdf,
};
