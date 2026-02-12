  import mongoose from 'mongoose';

let connected = false;
async function dbConnect () {
  mongoose.set('strictQuery', true);
  if(connected) {
      return;
    }
    try {
     await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: "Property360",
      })
      connected = true;

    } catch (error) {
 
    }

}

export default dbConnect;

