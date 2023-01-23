async function makePreSignedUrls(s3,bucket_name, url_expiration, payload){
    const { fileKey, fileId, parts } = JSON.parse(payload)

    const multipartParams = {
        Bucket: bucket_name,
        Key: fileKey,
        UploadId: fileId,
    }

    const promises = []

    for (let index = 0; index < parts; index++) {
        promises.push(
            s3.getSignedUrlPromise("uploadPart", {
            ...multipartParams,
            PartNumber: index + 1,
            Expires: parseInt(url_expiration)
            }),
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