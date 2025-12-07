// backend/middleware/checkOwnership.js
import Roadmap from '../models/roadmapModel.js';

/**
 * checkOwnership - ensures the authenticated user (req.user) owns the roadmap
 * Usage: router.get('/.../:id', protect, checkOwnership, handler)
 */
export async function checkOwnership(req, res, next) {
  try {
    const roadmapId = req.params.id;
    const roadmap = await Roadmap.findById(roadmapId).lean();
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    const requesterId = req.user && (req.user.id || req.user._id);
    const ownerId = roadmap.user ? roadmap.user.toString() : null;

    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: no user in request' });
    }

    if (ownerId && ownerId === requesterId.toString()) return next();

    // OPTIONAL: you may support collaborators if roadmap.collaborators exists
    // if (roadmap.collaborators && roadmap.collaborators.includes(requesterId)) return next();

    return res.status(403).json({ error: 'Forbidden: you do not have access to this resource' });
  } catch (err) {
    console.error('checkOwnership error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// default export to satisfy `import checkOwnership from '...';`
export default checkOwnership;
