# syntax=docker/dockerfile:1

# Plain JIT build (no ReadyToRun, no NativeAOT) — this spike measures the
# ordinary CoreCLR startup path on Cloud Run.
ARG RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# Build-time only: this sandbox routes egress through a TLS-terminating proxy.
# None of this lands in the runtime image.
ARG BUILD_PROXY=""
# The [t] glob makes this a no-op when no ca-bundle.crt is present, so the
# Dockerfile works unchanged outside a TLS-intercepting sandbox.
COPY ca-bundle.cr[t] /tmp/ccr/
RUN if [ -f /tmp/ccr/ca-bundle.crt ]; then \
      cat /tmp/ccr/ca-bundle.crt >> /etc/ssl/certs/ca-certificates.crt; \
    fi; rm -rf /tmp/ccr
ENV HTTPS_PROXY=${BUILD_PROXY} \
    https_proxy=${BUILD_PROXY} \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1

WORKDIR /src
# RESTORE_ARGS must carry the same RID as PUBLISH_ARGS (ReadyToRun needs a
# RID-specific restore), otherwise publish fails with NETSDK1047.
ARG RESTORE_ARGS=""
COPY src/ColdStartProbe/ColdStartProbe.csproj ./ColdStartProbe/
RUN dotnet restore ./ColdStartProbe/ColdStartProbe.csproj ${RESTORE_ARGS}
COPY src/ColdStartProbe/ ./ColdStartProbe/
ARG PUBLISH_ARGS=""
RUN dotnet publish ./ColdStartProbe/ColdStartProbe.csproj \
      -c Release -o /app/publish --no-restore ${PUBLISH_ARGS}

FROM ${RUNTIME_IMAGE} AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV DOTNET_TieredPGO=1 \
    ASPNETCORE_ENVIRONMENT=Production \
    PORT=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ColdStartProbe.dll"]
