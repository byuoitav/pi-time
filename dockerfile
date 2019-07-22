FROM byuoitav/amd64-alpine
LABEL Daniel Gallafant Randall <danny_randall@byu.edu>

ARG NAME
ENV name=${NAME}

COPY ${name}-bin ${name}-bin 
COPY version.txt version.txt

# add any required files/folders here
COPY analog-dist analog-dist

ENTRYPOINT ./${name}-bin
