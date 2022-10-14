require('dotenv').config();
import { MongoClient } from 'mongodb';

const cleanup = async () => {
    console.log('Starting cleanup script for classes without valid courses...');
    const agg = [
        {
            $lookup: {
                from: 'courses',
                localField: 'courseId',
                foreignField: '_id',
                as: 'cid',
            },
        },
        {
            $unwind: {
                path: '$cid',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $match: {
                cid: null,
            },
        },
    ];

    const client = await MongoClient.connect(
        `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`,
        { useNewUrlParser: true, useUnifiedTopology: true }
    );

    const coll = client.db('moving').collection('classes');
    const ids = await coll
        .aggregate(agg)
        .map((chunk) => chunk._id)
        .toArray();

    const deleted = await coll.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${deleted.deletedCount} orphaned classes`);
    await client.close();
};

cleanup();
