# Runbook — coturn (STUN/TURN) en el VPS

WP-U88 / D-17: ICE propio (FOSS). Zeus no usa Google STUN en producción.
Los `iceServers` salen de `presets-sdk/env` (`resolveIceServers`).

## Variables

```bash
# STUN (UDP 3478 típico)
ZEUS_WEBRTC_STUN=stun:coturn.tu-dominio:3478

# TURN (relay) — opcional pero recomendado tras NAT agresivo
ZEUS_WEBRTC_TURN_URL=turn:coturn.tu-dominio:3478
ZEUS_WEBRTC_TURN_USER=zeus
ZEUS_WEBRTC_TURN_PASS=********

# Nunca en prod:
# ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1
```

## Instalación típica (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install coturn
sudo systemctl enable coturn
```

Editar `/etc/turnserver.conf` (mínimo ilustrativo):

```
listening-port=3478
fingerprint
lt-cred-mech
user=zeus:CHANGE_ME
realm=tu-dominio
# listening-ip / external-ip según la NIC pública del VPS
# no-cli          # endurecer en prod
# no-multicast-peers
```

Abrir firewall UDP/TCP 3478 (y el rango relay si se configura
`min-port`/`max-port`). Reiniciar:

```bash
sudo systemctl restart coturn
sudo systemctl status coturn
```

## Comprobar

Desde una máquina cliente:

```bash
# Si tienes turnutils (paquete coturn-utils / coturn):
turnutils_stunclient coturn.tu-dominio
```

En Zeus: arrancar el mesh con las `ZEUS_WEBRTC_*` apuntando al coturn y
correr `npm run e2e:webrtc-signaling` (ese e2e usa iceServers vacíos a
propósito; para validar coturn, setear STUN en el entorno de prueba y
repetir un peer manual / U89).

## Estado de verificación en este WP

⏳ **sin verificar en VPS** — este worker no tiene acceso al VPS del pub.
El runbook queda documentado; la prueba real queda para cuando haya
credenciales/acceso (orquestador / ops).

## Alternativa

[eturnal](https://github.com/processone/eturnal) es TURN FOSS compatible;
misma idea: URL en `ZEUS_WEBRTC_*`, nunca Google en prod.
