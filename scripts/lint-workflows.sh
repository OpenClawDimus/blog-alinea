#!/usr/bin/env bash
# lint-workflows.sh — regras obrigatorias para .github/workflows/*.yml (custo + robustez)
#
# Roda no CI (job `quality`) e no pre-commit (G6). Sai com 1 se alguma regra falhar.
#
#   R1  todo job tem `timeout-minutes` inteiro, <= 30   (sem isso o limite e 360 min)
#   R2  todo workflow tem `concurrency.group`
#   R3  job que toca infra local (docker/sudo/coolify/localhost:8000|3000)
#       tem que rodar em runner self-hosted
#   R4  workflow acionado por pull_request tem `cancel-in-progress: true`
#
# Excecao (rara, justificar): linha no arquivo do workflow
#   # gha-lint-allow: R1 motivo curto
#
# Contexto: GitHub-hosted = minutos pagos (Free 2.000/mes, budget $0 com stop usage);
# self-hosted so para o que precisa do host. Ver memory/sops/github_actions_selfhosted_runner_sop.md
set -euo pipefail

DIR="${1:-.github/workflows}"
python3 - "$DIR" <<'PY'
import glob, re, sys
try:
    import yaml
except ImportError:
    print("lint-workflows: PyYAML ausente (pip install pyyaml)"); sys.exit(1)

INFRA = re.compile(r"\bdocker\b|\bsudo\b|coolify|(localhost|127\.0\.0\.1):(8000|3000)\b", re.I)
fails = []

def allowed(raw, rule):
    return re.search(r"#\s*gha-lint-allow:\s*" + rule + r"\b", raw) is not None

for path in sorted(glob.glob(sys.argv[1] + "/*.y*ml")):
    raw = open(path, encoding="utf-8").read()
    doc = yaml.safe_load(raw) or {}
    on = doc.get(True, doc.get("on")) or {}          # PyYAML le `on:` como True
    if isinstance(on, str): on = {on: None}
    if isinstance(on, list): on = {k: None for k in on}

    conc = doc.get("concurrency")
    group = conc.get("group") if isinstance(conc, dict) else conc
    if not group and not allowed(raw, "R2"):
        fails.append(f"{path}: R2 sem `concurrency.group`")
    if "pull_request" in on and not allowed(raw, "R4"):
        cip = conc.get("cancel-in-progress") if isinstance(conc, dict) else None
        if cip is not True:
            fails.append(f"{path}: R4 pull_request exige `cancel-in-progress: true`")

    for jid, job in (doc.get("jobs") or {}).items():
        t = job.get("timeout-minutes")
        if not allowed(raw, "R1"):
            if not isinstance(t, int) or t <= 0 or t > 30:
                fails.append(f"{path}: R1 job `{jid}` sem timeout-minutes inteiro entre 1 e 30 (atual: {t!r})")
        runs_on = job.get("runs-on")
        labels = runs_on if isinstance(runs_on, list) else [runs_on]
        self_hosted = any(str(l) == "self-hosted" for l in labels)
        blob = "\n".join(str(s.get("run", "")) for s in (job.get("steps") or []))
        if INFRA.search(blob) and not self_hosted and not allowed(raw, "R3"):
            fails.append(f"{path}: R3 job `{jid}` usa infra local mas roda em {runs_on!r} (use self-hosted)")

if fails:
    print("lint-workflows: FALHOU")
    for f in fails: print("  x " + f)
    sys.exit(1)
print("lint-workflows: OK")
PY
