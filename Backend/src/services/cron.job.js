import cron from 'node-cron';
import { autoMarkAbsent } from '../Controllers/attendance.controller.js';
import { autoApplyDeadlineDeductions } from '../Controllers/scoreDeduction.controller.js';
import { getSettingValue } from '../Controllers/setting.controller.js';

export const startCronJobs = () => {

  // ============================================
  // AUTO MARK ABSENT — Daily at 5:01 PM
  // ============================================
  cron.schedule('1 17 * * *', async () => {
    try {
      const isEnabled = await getSettingValue('autoMarkAbsent', false);
      if (!isEnabled) return;
      await autoMarkAbsent();
    } catch {
      // Silent — cron failures should not crash the server
    }
  });

  // ============================================
  // AUTO DEADLINE MISS DEDUCTIONS — Daily at 8:00 AM
  // Scans all tasks, applies deductions for any
  // task whose deadline has passed and is not done
  // ============================================
  cron.schedule('0 8 * * *', async () => {
    try {
      await autoApplyDeadlineDeductions();
    } catch {
      // Silent
    }
  });

};

export default startCronJobs;
