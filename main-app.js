const ipc = require('electron').ipcMain
const rp = require('request-promise')
const promise = require('bluebird')

const config = require('./config.local.json')

const GITHUB_OWNER = config.github.owner
const GITHUB_TOKEN = config.github.token

class Github {
    static call(url, headers) {
        return this.request('https://api.github.com/' + url, headers)
    }

    static request(url, headers) {
        let defaultHeaders = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN,
            'User-Agent': "cochanges.com-release-app"
        }
        console.log(url)
        return rp({
            url: url,
            headers: Object.assign({}, defaultHeaders, headers)
        })
    }

}

class Project {

    static list() {
        return Github.call(`search/repositories?q=user:${GITHUB_OWNER}&sort=updated`)
            .then((body) => {
                return JSON.parse(body).items;
            })

        // return require('./test-data/load-repos.json')
    }

    constructor(repo) {
        this.repo = repo
    }

    getDeps() {
        return Github.call(`search/code?q=repo:${this.repo}+filename:package.json`)
            .then((body) => {
                let npmFiles = JSON.parse(body)
                let files = []
                for (let npmFile of npmFiles.items) {
                    files.push(
                        Github.call(`repos/${this.repo}/contents/${npmFile.path}`, {'Accept': 'application/vnd.github.v3.raw'})
                    )
                }
                promise.all(files).then((files) => {
                    for (let f of files) {
                        console.log(f)
                    }
                })
            })

        // let npmFiles = require('./test-data/find-repo-dep-files.json')
    }

}

ipc.on('load-repos:request', (event) => {
    Project.list().then((repos) => {
        event.sender.send('load-repos:result', repos)
    })
})

ipc.on('find-repo-dep-files:request', (event, repo) => {
    let project = new Project(repo)
    project.getDeps().then((deps) => {
        event.sender.send('find-repo-dep-files:result', deps)
    })
})
