const { execSync } = require('child_process')

const gitStatus = exec('git status --porcelain').stdout

if (gitStatus) {
  console.error('Git working directory not clean. Please commit all chances to release a new package to npm.')
  console.error('Git status:', gitStatus)
  process.exit(2)
}

var versionIncrement = process.argv[process.argv.length - 1]
var versionIncrements = ['major', 'minor', 'patch']

if (versionIncrements.indexOf(versionIncrement) < 0) {
  console.error('Usage: node release.js major|minor|patch')
  process.exit(1)
}

exec('npm test')

exec('npm version ' + versionIncrement)

exec('git push')
exec('git push --tags')
exec('npm publish')

function exec (cmd) {
  var stdout = execSync(cmd, { encoding: 'utf-8' })

  return {
    stdout
  }
}
