# Gives one AI agent its own copy of the repo to work in (a "git worktree").
#
# A worktree is an extra folder linked to this same repo, on its own branch,
# with its own files, staging area and .next build folder. Agents in separate
# worktrees can't see or break each other's half-finished work.
#
# Usage, from the repo folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\new-agent-worktree.ps1 agent-1 post-it-colors
# creates ..\calendar-app-agent-1 on a new branch "agent-1/post-it-colors",
# starting from the latest origin/main, and installs its packages.
#
# When the agent is done (everything pushed):
#   git worktree remove ..\calendar-app-agent-1
#   git branch -D agent-1/post-it-colors

param(
    [Parameter(Mandatory = $true)] [string] $Label,  # the agent's label, e.g. agent-1
    [Parameter(Mandatory = $true)] [string] $Task    # a short task name, e.g. post-it-colors
)

$ErrorActionPreference = 'Stop'

$repoFolder = Split-Path -Parent $PSScriptRoot
$worktreeFolder = Join-Path (Split-Path -Parent $repoFolder) "calendar-app-$Label"
$branch = "$Label/$Task"

if (Test-Path $worktreeFolder) {
    throw "$worktreeFolder already exists. Remove that agent's old worktree first (git worktree remove $worktreeFolder)."
}

git -C $repoFolder fetch origin
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

git -C $repoFolder worktree add $worktreeFolder -b $branch origin/main
if ($LASTEXITCODE -ne 0) { throw 'git worktree add failed.' }

Push-Location $worktreeFolder
try {
    # Also runs "prisma generate", which this folder needs its own copy of.
    npm install
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }

    # Next writes the PageProps/LayoutProps types into .next/, which a fresh
    # folder doesn't have yet, so "npx tsc --noEmit" fails until this runs.
    npx next typegen
    if ($LASTEXITCODE -ne 0) { throw 'next typegen failed.' }
}
finally {
    Pop-Location
}

Write-Host ''
Write-Host "Ready: $worktreeFolder (branch $branch)" -ForegroundColor Green
Write-Host 'Next steps:'
Write-Host "  1. Copy your .env file into $worktreeFolder (git doesn't copy it; agents must not touch it)."
Write-Host "  2. Start the agent in that folder, e.g.: cd $worktreeFolder; claude"
Write-Host '  3. Give its dev server a free port, e.g.: $env:SKIP_LOGIN="true"; npm run dev -- -p 3001'
