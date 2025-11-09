// backend/controllers/exportController.js
import Roadmap from '../models/roadmapModel.js'; // ensure your model exports default in ES modules
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { roadmapToGantt } from '../utils/gantt.js';

export const exportJSON = async (req, res) => {
  try {
    const r = await Roadmap.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: 'Roadmap not found' });

    res.setHeader('Content-disposition', `attachment; filename=roadmap-${r._id}.json`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('exportJSON error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const exportCSV = async (req, res) => {
  try {
    const r = await Roadmap.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: 'Roadmap not found' });

    const rows = (r.steps || []).map(s => ({
      roadmapId: r._id.toString(),
      roadmapTitle: r.title || '',
      stepId: s._id ? s._id.toString() : '',
      title: s.title || '',
      description: s.description || '',
      startDate: s.startDate ? new Date(s.startDate).toISOString() : '',
      endDate: s.endDate ? new Date(s.endDate).toISOString() : '',
      durationDays: s.durationDays || '',
      order: s.order || ''
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.setHeader('Content-disposition', `attachment; filename=roadmap-${r._id}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  } catch (err) {
    console.error('exportCSV error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const r = await Roadmap.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: 'Roadmap not found' });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-disposition', `attachment; filename=roadmap-${r._1d}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text(r.title || 'Roadmap', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Created: ${new Date(r.createdAt || Date.now()).toLocaleString()}`);
    doc.moveDown();

    (r.steps || []).forEach((s, idx) => {
      doc.fontSize(14).text(`${idx + 1}. ${s.title || 'Untitled'}`);
      if (s.description) doc.fontSize(11).text(s.description);
      const sd = s.startDate ? new Date(s.startDate).toLocaleDateString() : '—';
      const ed = s.endDate ? new Date(s.endDate).toLocaleDateString() : '—';
      doc.fontSize(10).text(`Start: ${sd}   End: ${ed}   Duration days: ${s.durationDays || '—'}`);
      doc.moveDown(0.5);
    });

    // Gantt summary page
    doc.addPage();
    doc.fontSize(16).text('Gantt Tasks (summary)', { underline: true });
    doc.moveDown(0.5);

    const tasks = roadmapToGantt(r);
    tasks.forEach((t, i) => {
      doc.fontSize(12).text(`${i+1}. ${t.name}`);
      doc.fontSize(10).text(`   ${new Date(t.start).toLocaleDateString()} -> ${new Date(t.end).toLocaleDateString()}   deps: ${t.dependencies.join(', ') || '—'}`);
      doc.moveDown(0.2);
    });

    doc.end();
  } catch (err) {
    console.error('exportPDF error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// default export for convenience when importing as default
export default {
  exportJSON,
  exportCSV,
  exportPDF
};
