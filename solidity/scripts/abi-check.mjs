import fs from 'fs'
import path from 'path'

function args(json) {
    let out = []
    for(let i in json) {
        let arg = json[i]
        out.push(`<${arg.type}> ${arg.name}`)
    }
    return out.join(', ')
}

function parseAbi(abi) {
    let i = 0
    for(let k in abi.abi) {
        let rec = abi.abi[k]
        if(rec.type == 'function') {
            i++
            console.log(i, rec.type, rec.name)
            if(rec.inputs.length) console.log('args:', args(rec.inputs))
            if(rec.outputs.length) console.log('returns:', args(rec.outputs))
            console.log('')
        } else {
            console.log(rec.type, rec.name)
        }
    }
}

async function abiCheck(contractFilename) {
    const path = '../artifacts/contracts/'+contractFilename+''

    try {
        const files = await fs.promises.readdir(path)
        for (const file of files) if(file.endsWith("json")) {
            if (file.includes(".dbg.")) {
                // skip debug files
                console.log('debug file: ' + file)
            } else {
                console.log('abi file found: ' + file)
                try {
                    const abi = JSON.parse(fs.readFileSync(path + '/' + file))
                    parseAbi(abi)
                } catch (err) {
                    console.log(err)
                }
                break
            }
        }
    } catch (err) {
        console.log('Unable to scan directory: ' + err)
    }
}

const main = async () => {
    try {
        const args = process.argv.slice(2)
        if (args.length !== 1) {
            console.error(`usage: ${process.argv[0]} ${process.argv[1]} <contract_filename>.sol`)
            process.exit(1)
        }

        const [contract] = args
        abiCheck(contract)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
};

main();
