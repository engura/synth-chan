import { NFTStorage, File } from 'nft.storage'
// The 'mime' npm package helps us set the correct file type on our File objects
import mime from 'mime'
import fs from 'fs'
import path from 'path'

import dotenv from 'dotenv'
dotenv.config();

const {
  NFT_STORAGE_KEY
} = process.env;

/**
  * Reads an image file from `imagePath` and stores an NFT with the given name and description.
  * @param {string} imagePath the path to an image file
  * @param {string} name a name for the NFT
  * @param {string} description a text description for the NFT
  */
async function storeNFT(imagePath, name, description) {
    // load the file from disk
    const content = await fs.promises.readFile(imagePath)
    const type = mime.getType(imagePath)
    const image = new File([content], path.basename(imagePath), { type })

    // create a new NFTStorage client using our API key
    const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })

    // call client.store, passing in the image & metadata
    return nftstorage.store({
        image,
        name,
        description,
    })
}

async function uploadFile(imagePath) {
    const content = await fs.promises.readFile(imagePath)
    const type = mime.getType(imagePath)
    const image = new File([content], path.basename(imagePath), { type })

    const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })
    return nftstorage.storeBlob(image)
}

async function uploadImages(imagePath) {
    let ipfsData = {}
    const ipfsPath = imagePath+'/ipfs.json'

    try {
        ipfsData = JSON.parse(fs.readFileSync(ipfsPath))
    } catch (error) {
        // we don't really care about DNE errors
        console.log(error)
    }
    console.log(imagePath, ipfsData)

    try {
        const files = await fs.promises.readdir(imagePath)
        let i = 0;
        for (const file of files) if(file.endsWith("png") || file.endsWith("jpg")) {
            i += 1
            // if(i > 4) break
            if (file in ipfsData) {
                // skip uploading to ipfs
                console.log('Already in IPFS: ' + file)
            } else {
                console.log(i + ': ' + file + ' uploading...')
                let result = await uploadFile(imagePath + '/' + file)
                console.log(result+'\n')
                ipfsData[file] = result
            }
        }
        fs.writeFileSync(ipfsPath, JSON.stringify(ipfsData, null, 2))
    } catch (err) {
        console.log('Unable to scan directory: ' + err)
    }
}

/**
 * The main entry point for the script that checks the command line arguments and
 * calls storeNFT.
 * 
 * To simplify the example, we don't do any fancy command line parsing. Just three
 * positional arguments for imagePath, name, and description
 */
const main = async () => {
    try {
        const args = process.argv.slice(2)
        if (args.length !== 1) {
            console.error(`usage: ${process.argv[0]} ${process.argv[1]} <sr_art_path>`)
            process.exit(1)
        }

        const [imagePath] = args
        uploadImages(imagePath)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
};

main();
