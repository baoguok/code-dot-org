#!/bin/bash
set -e

MEM_PER_PROCESS=4096

if [ "$(uname)" = "Darwin" ]; then
  PROCS=2 # TODO: set this dynamically like in linux
elif [ "$(uname)" = "Linux" ]; then
  NPROC=$(nproc)

  # Use MemAvailable when available, otherwise fall back to MemFree
  if grep -q MemAvailable /proc/meminfo; then
    MEM_METRIC=MemAvailable
  else
    MEM_METRIC=MemFree
  fi

  # Don't run more processes than can fit in free memory.
  MEM_PROCS=$(awk "/${MEM_METRIC}/ {printf \"%d\", \$2/1024/${MEM_PER_PROCESS}}" /proc/meminfo)
  PROCS=$(( ${MEM_PROCS} < ${NPROC} ? ${MEM_PROCS} : ${NPROC} ))

  if [ $PROCS -eq 0 ]; then
    FREE_KB=$(awk "/MemFree/ {printf \"%d\", \$2/1024}" /proc/meminfo)
    echo "Warning: There may not be enough free memory to run tests. Required: ${MEM_PER_PROCESS}KB; Free: ${FREE_KB}KB"
    PROCS=1
  fi
else
  echo "$(uname) not supported"
  exit 1
fi

if [ -n "$DRONE" ]; then
  CODECOV=/tmp/codecov.sh
  curl -s https://codecov.io/bash > ${CODECOV}
  chmod +x ${CODECOV}
  CODECOV="$CODECOV -C $DRONE_COMMIT_SHA"
else
  # For non-Drone runs, stub-out codecov.
  CODECOV=: # stub
fi

GRUNT_CMD="node --max_old_space_size=${MEM_PER_PROCESS} `npm bin`/grunt"
$GRUNT_CMD preconcat

echo "Running with parallelism: ${PROCS}"
PARALLEL="xargs -I{} -P${PROCS} -L1 /bin/bash -c {}"

${PARALLEL} <<SCRIPT
npm run lint
(PORT=9876 ${GRUNT_CMD} unitTest && ${CODECOV} -cF unit)
(PORT=9877 $GRUNT_CMD storybookTest && ${CODECOV} -cF storybook)
# Since scratch tests are disable this also needs to be disable. If enable scratch tests
# then uncomment this
# (PORT=9878 $GRUNT_CMD scratchTest && ${CODECOV} -cF scratch)
(PORT=9879 LEVEL_TYPE='turtle' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9880 LEVEL_TYPE='maze|bounce|calc|eval|flappy' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9881 LEVEL_TYPE='gamelab' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9882 LEVEL_TYPE='craft' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9883 LEVEL_TYPE='applab1' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9884 LEVEL_TYPE='applab2' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
(PORT=9885 LEVEL_TYPE='studio' $GRUNT_CMD karma:integration && ${CODECOV} -cF integration)
SCRIPT
