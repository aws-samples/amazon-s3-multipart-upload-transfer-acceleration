import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function makePreSignedUrls(s3, bucket_name, url_expiration, payload) {
    const { fileKey, fileId, parts } = JSON.parse(payload)

    const multipartParams = {
        Bucket: bucket_name,
        Key: fileKey,
        UploadId: fileId,
    }

    const promises = []

    for (let index = 0; index < parts; index++) {
        const command = new UploadPartCommand({
            ...multipartParams,
            PartNumber: index + 1,
        });
        promises.push(
            getSignedUrl(s3, command, { expiresIn: parseInt(url_expiration) }),
        )
    }

    const signedUrls = await Promise.all(promises)

    return signedUrls.map((signedUrl, index) => {
        return {
            signedUrl: signedUrl,
            PartNumber: index + 1,
        }
    })

}
module.exports.makePreSignedUrls = makePreSignedUrls
