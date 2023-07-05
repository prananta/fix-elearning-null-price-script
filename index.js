const { MongoClient } = require("mongodb");

// Command line arguments
let uri = process.argv[2] || "mongodb://localhost:27017"; // URI will be the first argument
let limit = parseInt(process.argv[3], 10) || 10; // limit will be the second argument

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log("trying to connect to mongo");
    await client.connect();

    console.log("connected to mongo");

    const db = client.db("elearning"); // replace 'myDB' with your database name
    const vouchers = db.collection("vouchers");
    const payrexxes = db.collection("payrexxes");

    // lookup between vouchers and payrexxes
    const result = await vouchers
      .aggregate([
        {
          $match: { price: null },
        },
        {
          $lookup: {
            from: "payrexxes",
            localField: "chargeId",
            foreignField: "transactionId",
            as: "payrexxInfo",
          },
        },
        {
          $unwind: "$payrexxInfo",
        },
        {
          $sort: { created: -1 }, // sort by 'created' in descending order
        },
        {
          $limit: limit, // limit the number of documents to 10
        },
      ])
      .toArray();

    for (let item of result) {
      console.log(item._id, item.code, item.chargeId);
      let originalAmount = item.payrexxInfo.invoice.originalAmount;
      await vouchers.updateOne(
        { _id: item._id },
        { $set: { price: originalAmount } }
      );
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
