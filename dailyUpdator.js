const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_URI;

const notificationSchema = require("./database/mongooseSchema/notificationSchema");
const makeNotification = require("./src/modules/makeNotification");
const { getManyResults } = require("./src/modules/sqlHandler");

mongoose
  .connect(uri)
  .then(async() => {
    console.log("mongoose connected");
    await dailyUpdator();    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error(err);
  });


const dailyUpdator = async() => {
  try {
    const today = new Date();

    const startOfTomorrow = new Date(today);
    startOfTomorrow.setDate(today.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const personalSchedules = await getManyResults(`
        SELECT user_idx, contents FROM calenduck.personal_schedule 
        WHERE time >= $1 AND time <= $2 AND priority=true
    `, [startOfTomorrow, endOfTomorrow]);

    const interestSchedules = await getManyResults(`
        SELECT CI.interest_name, CIS.contents
        FROM calenduck.interest_priority CIP
        JOIN calenduck.interest_schedule CIS ON CIS.idx = CIP.interest_schedule_idx
        JOIN calenduck.interest CI ON CIS.interest_idx = CI.idx
        WHERE CIS.time >= $1 AND CIS.time <=$2
    `, [startOfTomorrow, endOfTomorrow]);

    for (const schedule of personalSchedules) {
      await makeNotification(schedule.user_idx, "import", {
        contents: schedule.contents,
      });
    }
    for (const schedule of interestSchedules) {
      await makeNotification(schedule.user_idx, "import", {
        interest: schedule.interest,
        contents: schedule.contents,
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await notificationSchema.deleteMany({ created_at: { $lt: thirtyDaysAgo }});
  } catch (err) {
    console.error(err);
  }
};
