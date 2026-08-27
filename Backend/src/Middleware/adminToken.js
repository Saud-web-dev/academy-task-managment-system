/**
 * adminToken.js — Legacy compatibility shim
 *
 * Previously this was the only admin guard.
 * Now replaced by authorization.js → requireTeamLeader.
 * Kept for backward compatibility during migration.
 */
import { requireTeamLeader } from "./authorization.js";

const isAdmin = requireTeamLeader;

export default isAdmin;
