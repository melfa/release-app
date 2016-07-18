// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const ipc = require('electron').ipcRenderer
import React from 'react'
import ReactDOM from 'react-dom'
import datetime from 'node-datetime'

class Repositories extends React.Component {

    constructor(props) {
        super(props)
        this.state = {branch: datetime.create().format('release-Ymd')}
        this.onBranchChange = this.onBranchChange.bind(this)
        this.onRepoChange = this.onRepoChange.bind(this)
    }

    onBranchChange(e) {
        this.setState({branch: e.target.value});
    }

    onRepoChange(e) {
        let repo = e.target.dataset.repo
        this.setState({repo: repo});
        ipc.send('find-repo-dep-files:request', repo)
    }

    render() {
        var createRepo = (repo) => {
            return <a className="collection-item" onClick={this.onRepoChange} key={repo.full_name} data-repo={repo.full_name}>{repo.name}</a>
        }

        return (
            <ul className="collection with-header">
                <li className="collection-header"><h4>Репозиторий</h4></li>
                {this.props.repos.map(createRepo)}
                {/*Ветка <input type="text" value={this.state.branch} onChange={this.onBranchChange}/>*/}
            </ul>
        )
    }
}


ipc.on('load-repos:result', (event, repos) => {
    ReactDOM.render(<Repositories repos={repos}/>, document.getElementById('repositories'))
})

ipc.send('load-repos:request')
