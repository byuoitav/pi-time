FROM gcr.io/distroless/static
MAINTAINER Daniel Randall <danny_randall@byu.edu>

ARG NAME

COPY ${NAME} /pi-time
COPY analog /analog

ENTRYPOINT ["/pi-time"]
