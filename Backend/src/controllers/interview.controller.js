const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    // required here (not at the top of the file) so that if PDF parsing ever breaks,
    // it only fails this one request instead of crashing the whole serverless function
    // (which previously took down /api/auth/* too, since api/index.js loads this whole file on cold start)
    // Node doesn't implement Math.sumPrecise yet (a very recent JS addition), but pdf.js
    // (bundled inside unpdf) calls it unconditionally in some internal font-table code.
    // Polyfilling it here avoids intermittent crashes on resumes with embedded fonts.
    // Safe no-op once Node ships the real one.
    if (typeof Math.sumPrecise !== "function") {
        Math.sumPrecise = (numbers) => [...numbers].reduce((sum, n) => sum + n, 0)
    }

    const { extractText, getDocumentProxy } = require("unpdf")
    const pdfDocument = await getDocumentProxy(new Uint8Array(req.file.buffer))
    const resumeContent = await extractText(pdfDocument, { mergePages: true })
    const { selfDescription, jobDescription } = req.body

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    try {
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        res.status(501).json({
            message: "PDF generation is not available in this deployment environment. Puppeteer requires a server with Chrome installed and cannot run on Vercel Serverless Functions."
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
