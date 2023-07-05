const { MongoClient } = require("mongodb");

async function run() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();

    const db = client.db("myDB"); // replace 'myDB' with your database name
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
          $limit: 10, // limit the number of documents to 10
        },
      ])
      .toArray();

    for (let item of result) {
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
