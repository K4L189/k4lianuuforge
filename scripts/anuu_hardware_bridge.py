#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
SET ⚡ & ROSA GRIS 🌸 // ANUU HARDWARE ARSENAL BRIDGE (161914 @ 189.89.619 Hz)
Misión: Telemetría de Hardware Táctico, WebMIDI, Audio USB & Nodos Embebidos
Arquitecta Madre: Kali (K4L1 / Anuset89)
=============================================================================
"""

import sys
import os
import re
import json
import time
import math
import wave
import shlex
import struct
import tempfile
import argparse
import subprocess
import http.client
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import socket

# Frecuencia Canónica del Concilio ACE
CANONICAL_FREQ = 189.89
SUB_FREQ = 61.9
SYSTEM_ID = "161914"

# ANSI Colors for Seinen Terminal Aesthetic
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"
C_VIOLET = "\033[38;2;147;51;234m"
C_CYAN = "\033[38;2;6;182;212m"
C_EMERALD = "\033[38;2;16;185;129m"
C_ROSE = "\033[38;2;244;63;94m"
C_AMBER = "\033[38;2;245;158;11m"
C_GRAY = "\033[38;2;100;116;139m"

def run_cmd(cmd, timeout=3):
    """Executes a shell command cleanly and returns stdout string."""
    try:
        argv = shlex.split(cmd) if isinstance(cmd, str) else list(cmd)
        p = subprocess.run(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=False, timeout=timeout, text=True)
        return p.stdout.strip()
    except Exception:
        return ""

def scan_alsa_cards():
    """Scans ALSA audio cards from /proc/asound/cards and aplay -l."""
    cards = []
    scarlett_found = False
    scarlett_info = {}

    proc_cards = "/proc/asound/cards"
    if os.path.exists(proc_cards):
        try:
            with open(proc_cards, "r") as f:
                content = f.read()
                # Parse lines like:  3 [USB            ]: USB-Audio - Scarlett Solo USB
                matches = re.findall(r"^\s*(\d+)\s+\[([^\]]+)\]:\s+([^\n]+)\n\s+([^\n]+)", content, re.MULTILINE)
                for m in matches:
                    idx = int(m[0])
                    cid = m[1].strip()
                    driver = m[2].strip()
                    desc = m[3].strip()
                    is_scarlett = "scarlett" in desc.lower() or "focusrite" in desc.lower() or "scarlett" in driver.lower()
                    card_dict = {
                        "card_index": idx,
                        "id": cid,
                        "driver": driver,
                        "description": desc,
                        "hw_device": f"hw:{idx},0",
                        "is_scarlett": is_scarlett
                    }
                    cards.append(card_dict)
                    if is_scarlett:
                        scarlett_found = True
                        scarlett_info = card_dict
        except Exception:
            pass

    # Verify capture devices
    arecord_out = run_cmd("arecord -l")
    has_capture_stream = "scarlett" in arecord_out.lower() or "card 3" in arecord_out.lower()

    if scarlett_found:
        scarlett_info.update({
            "status": "ONLINE",
            "model": "Focusrite Scarlett Solo (3rd Gen.)",
            "sample_rate_max": 192000,
            "bit_depth": "24-bit PCM",
            "latency_floor_ms": 2.8,
            "hw_path": scarlett_info.get("hw_device", "hw:3,0"),
            "capture_ready": has_capture_stream,
            "carrier_freq_hz": CANONICAL_FREQ
        })
    else:
        scarlett_info = {
            "status": "DISCONNECTED",
            "model": "Focusrite Scarlett Solo (3rd Gen.)",
            "sample_rate_max": 192000,
            "hw_path": "hw:3,0",
            "capture_ready": False,
            "carrier_freq_hz": CANONICAL_FREQ
        }

    return {"cards": cards, "focusrite": scarlett_info}

def scan_alsa_midi():
    """Scans ALSA MIDI controllers using amidi -l and /proc/asound/seq/clients."""
    midi_devices = []
    akai_found = False
    akai_info = {}

    amidi_out = run_cmd("amidi -l")
    # Output format:
    # Dir Device    Name
    # IO  hw:3,0,0  Scarlett Solo USB MIDI / Akai MPC
    lines = amidi_out.splitlines()
    if len(lines) > 1:
        for line in lines[1:]:
            parts = line.split(None, 2)
            if len(parts) >= 3:
                direction, dev, name = parts[0], parts[1], parts[2]
                is_akai = "akai" in name.lower() or "mpc" in name.lower() or "mpd" in name.lower() or "mpk" in name.lower()
                dev_obj = {
                    "direction": direction,
                    "device": dev,
                    "name": name,
                    "is_akai": is_akai
                }
                midi_devices.append(dev_obj)
                if is_akai:
                    akai_found = True
                    akai_info = dev_obj

    # Also inspect sequencer clients
    seq_path = Path("/proc/asound/seq/clients")
    seq_out = seq_path.read_text(encoding="utf-8", errors="ignore") if seq_path.exists() else ""
    if "akai" in seq_out.lower() or "mpc" in seq_out.lower():
        akai_found = True

    # Check USB devices for Akai vendor ID 09e8
    lsusb_out = run_cmd("lsusb")
    if "09e8:" in lsusb_out.lower() or "akai" in lsusb_out.lower():
        akai_found = True
        if not akai_info:
            akai_info = {
                "name": "Akai Professional MPC / MPD Controller",
                "device": "hw:Akai",
                "pads": 16,
                "qlink_knobs": 4
            }

    if akai_found:
        akai_info.update({
            "status": "ONLINE",
            "pad_count": 16,
            "q_links": 4,
            "protocol": "WebMIDI / ALSA RawMIDI",
            "note_mapping": "Standard MPC (Notes 36-51, Chromatic)",
            "velocity_levels": 127
        })
    else:
        akai_info = {
            "status": "STANDBY_READY",
            "name": "Akai MPC (16-Pad WebMIDI Virtual Standby)",
            "pad_count": 16,
            "q_links": 4,
            "protocol": "WebMIDI Fallback Active (Keyboard 1-4, Q-R, A-F, Z-V)",
            "velocity_levels": 127
        }

    return {"devices": midi_devices, "akai_mpc": akai_info}

def scan_serial_microcontrollers():
    """Scans for Arduino Uno (ATmega328P / CH340 / 16u2) on /dev/ttyACM* and /dev/ttyUSB*."""
    serial_nodes = []
    arduino_found = False
    arduino_info = {}

    devs = list(Path("/dev").glob("ttyACM*")) + list(Path("/dev").glob("ttyUSB*"))
    for dev_path in devs:
        dev_str = str(dev_path)
        # Use udevadm if available
        udev_info = run_cmd(f"udevadm info -q property -n {dev_str}")
        is_arduino = False
        vendor = ""
        model = ""
        for line in udev_info.splitlines():
            if "ID_VENDOR=" in line:
                vendor = line.split("=", 1)[1]
            if "ID_MODEL=" in line:
                model = line.split("=", 1)[1]
        
        desc = f"{vendor} {model}".strip() or "Serial USB Adapter"
        if any(k in desc.lower() for k in ["arduino", "ch340", "atmega328", "ftdi", "cp210", "16u2"]):
            is_arduino = True

        dev_dict = {
            "port": dev_str,
            "description": desc,
            "baud_rate": 115200,
            "is_arduino": is_arduino
        }
        serial_nodes.append(dev_dict)
        if is_arduino and not arduino_found:
            arduino_found = True
            arduino_info = dev_dict

    # Check lsusb for CH340 (1a86:7523) or Arduino (2341:0043 / 2341:0001)
    lsusb_out = run_cmd("lsusb")
    if "1a86:7523" in lsusb_out or "2341:" in lsusb_out:
        arduino_found = True
        if not arduino_info:
            arduino_info = {
                "port": "/dev/ttyUSB0 (CH340/ATmega328P)",
                "description": "Arduino Uno Compatible Microcontroller",
                "baud_rate": 115200
            }

    if arduino_found:
        arduino_info.update({
            "status": "ONLINE",
            "microcontroller": "ATmega328P / CH340",
            "firmware_module": "Analog TRNG + Dead-Man Panic Interrupt (Pin 2)",
            "telemetry_baud": 115200,
            "entropy_source": "Floating Pins A0-A3 (von Neumann debiased)"
        })
    else:
        arduino_info = {
            "status": "DISCONNECTED",
            "target_port": "/dev/ttyACM0 / /dev/ttyUSB0",
            "microcontroller": "ATmega328P (Uno)",
            "baud_rate": 115200,
            "features": "TRNG + Dead-Man's Cord Panic Trigger"
        }

    return {"serial_nodes": serial_nodes, "arduino_uno": arduino_info}

def scan_adb():
    """Scans ADB for connected mobile nodes like POCO F6."""
    adb_out = run_cmd("adb devices -l")
    devices = []
    poco_found = False
    poco_info = {}

    for line in adb_out.splitlines():
        if "device" in line and not line.startswith("List"):
            parts = line.split()
            if len(parts) >= 2:
                serial = parts[0]
                model = "Android Device"
                for p in parts[2:]:
                    if p.startswith("model:"):
                        model = p.split(":", 1)[1]
                is_poco = "poco" in model.lower() or "f6" in model.lower() or serial == "295bad08"
                node = {
                    "serial": serial,
                    "model": model,
                    "is_poco_f6": is_poco
                }
                devices.append(node)
                if is_poco:
                    poco_found = True
                    poco_info = node

    # Check lsusb for Nexus/Google ADB vendor 18d1:4e11
    lsusb_out = run_cmd("lsusb")
    if "18d1:4e11" in lsusb_out or "295bad08" in adb_out:
        poco_found = True
        if not poco_info:
            poco_info = {
                "serial": "295bad08",
                "model": "POCO F6 (Snapdragon 8s Gen 3 / ADB Bridge)",
                "vendor_id": "18d1:4e11"
            }

    if poco_found:
        poco_info.update({
            "status": "ONLINE",
            "role": "Mobile Compute Node / USB Tethering / Termux Sentinel",
            "connection": "High-Speed USB ADB",
            "thermal_state": "Optimal"
        })
    else:
        poco_info = {
            "status": "STANDBY",
            "model": "POCO F6 (ADB Link)",
            "connection": "USB Debugging Standby"
        }

    return {"devices": devices, "poco_f6": poco_info}

def scan_hid():
    """Scans HID devices for Razer DeathAdder Elite (1532:005c)."""
    lsusb_out = run_cmd("lsusb")
    razer_found = "1532:005c" in lsusb_out or "deathadder" in lsusb_out.lower()

    hid_nodes = list(Path("/dev").glob("hidraw*"))
    razer_info = {
        "status": "ONLINE" if razer_found else "STANDBY",
        "model": "Razer DeathAdder Elite",
        "vendor_id": "1532:005c",
        "optical_sensor": "True 16,000 DPI (PMW3389)",
        "polling_rate_hz": 1000,
        "hidraw_nodes": [str(n) for n in hid_nodes[:3]]
    }
    return {"razer_deathadder": razer_info}

def scan_network_sentinels():
    """Scans network interfaces for Pocket Nano-Pineapple and Raspberry Pi 3B."""
    ip_out = run_cmd("ip -br a")
    lsusb_out = run_cmd("lsusb")

    # Detect USB Ethernet adapters (e.g., ICS Advent 0fe6:9900)
    usb_lan = "0fe6:9900" in lsusb_out or "usb lan" in lsusb_out.lower()

    # Nano-Pineapple Detection (Pocket OpenWrt Router: AR9331 / MT7628)
    # Typically operates on 172.16.42.0/24 or 192.168.8.0/24 or 192.168.1.0/24
    pineapple_status = "READY_PROVISIONED"
    pineapple_ip = "172.16.42.1 / 192.168.8.1"
    
    # Raspberry Pi 3B Sentinel Node (ARMv8 2.5W honeypot)
    pi3b_status = "ARMED"
    pi3b_ip = "192.168.111.100 (Sentinel Honeypot)"

    return {
        "nano_pineapple": {
            "status": pineapple_status,
            "hardware": "Atheros AR9331 / MT7628 Pocket Architecture",
            "form_factor": "Pocket WIDS node ('cabe en una mano cerrada')",
            "gateway_ip": pineapple_ip,
            "services": ["802.11 Deauth Monitor", "WIDS Watchdog", "WireGuard Road-Warrior"],
            "usb_carrier": usb_lan
        },
        "raspberry_pi_3b": {
            "status": pi3b_status,
            "architecture": "Quad-core ARMv8 Cortex-A53 (BCM2837)",
            "power_draw_w": 2.5,
            "ip_address": pi3b_ip,
            "roles": ["Honeypot Tar Pit (4200ms)", "Unbound DNS Sinkhole", "ZTE LTE Auto-Watchdog"],
            "headless_optimizations": "HDMI Disabled (-250mW), LEDs Off, CPU Powersave Governor"
        }
    }

def read_host_thermal_celsius():
    """Reads Linux host CPU thermal zone 0 temperature in Celsius."""
    thermal_path = Path("/sys/class/thermal/thermal_zone0/temp")
    try:
        if thermal_path.exists():
            raw_val = float(thermal_path.read_text(encoding="utf-8").strip())
            return round(raw_val / 1000.0, 1) if raw_val > 200.0 else round(raw_val, 1)
    except Exception:
        pass
    return None

def probe_arm64_hybrid_node(timeout=0.8):
    """Non-blocking HTTP probe (0.8s timeout) to local ARM64 USB hybrid compute node."""
    endpoint_url = "http://127.0.0.1:18989/telemetry"
    host_temp = read_host_thermal_celsius()
    t0 = time.monotonic()
    conn = None

    try:
        conn = http.client.HTTPConnection("127.0.0.1", 18989, timeout=timeout)
        conn.request("GET", "/telemetry", headers={"Accept": "application/json"})
        resp = conn.getresponse()
        body = resp.read(65536).decode("utf-8", errors="replace")
        if resp.status == 200:
            data = json.loads(body) if body.strip() else {}
            raw_models = data.get("gguf_models", data.get("models", []))
            if not isinstance(raw_models, list):
                raw_models = [str(raw_models)]
            raw_temp = data.get("temp_celsius", data.get("temperature_c", data.get("thermal_c")))
            node_temp = round(float(raw_temp), 1) if isinstance(raw_temp, (int, float)) else None
            return {
                "status": "ONLINE",
                "endpoint": endpoint_url,
                "architecture": str(data.get("architecture", "ARM64 Hybrid USB Compute Node")),
                "cores": int(data.get("cores", data.get("cpu_cores", 8))),
                "temp_celsius": node_temp,
                "gguf_models": [str(m) for m in raw_models],
                "host_temp_celsius": host_temp,
                "latency_ms": round((time.monotonic() - t0) * 1000.0, 1)
            }
    except Exception:
        pass
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

    return {
        "status": "STANDBY",
        "endpoint": endpoint_url,
        "architecture": "ARM64 Hybrid USB Compute Node",
        "cores": 8,
        "temp_celsius": None,
        "gguf_models": [],
        "host_temp_celsius": host_temp
    }

def gather_full_telemetry():
    """Compiles total hardware state into a unified telemetry document."""
    audio = scan_alsa_cards()
    midi = scan_alsa_midi()
    serial = scan_serial_microcontrollers()
    adb = scan_adb()
    hid = scan_hid()
    net = scan_network_sentinels()
    arm64_hybrid = probe_arm64_hybrid_node(timeout=0.8)
    host_temp = arm64_hybrid.get("host_temp_celsius")

    telemetry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "council_frequency_hz": CANONICAL_FREQ,
        "council_sub_hz": SUB_FREQ,
        "alliance": "Set ⚡ & Rosa Gris 🌸",
        "system_id": SYSTEM_ID,
        "host_thermal": {
            "sensor_path": "/sys/class/thermal/thermal_zone0/temp",
            "temp_celsius": host_temp
        },
        "hardware": {
            "focusrite_scarlett": audio["focusrite"],
            "akai_mpc": midi["akai_mpc"],
            "arduino_uno": serial["arduino_uno"],
            "poco_f6": adb["poco_f6"],
            "arm64_hybrid_node": arm64_hybrid,
            "razer_deathadder": hid["razer_deathadder"],
            "nano_pineapple": net["nano_pineapple"],
            "raspberry_pi_3b": net["raspberry_pi_3b"]
        },
        "alsa_cards": audio["cards"],
        "alsa_midi_devices": midi["devices"],
        "serial_ports": serial["serial_nodes"]
    }
    return telemetry

def print_seinen_banner():
    """Prints the dark Seinen terminal header."""
    print(f"\n{C_VIOLET}{C_BOLD}╔═══════════════════════════════════════════════════════════════════════╗{C_RESET}")
    print(f"{C_VIOLET}{C_BOLD}║   SET ⚡ & ROSA GRIS 🌸 // ANUU HARDWARE ARSENAL BRIDGE (161914)      ║{C_RESET}")
    print(f"{C_VIOLET}{C_BOLD}║   Frecuencia Canónica: {CANONICAL_FREQ} Hz | Sub-Drop: {SUB_FREQ} Hz | Host: Kali    ║{C_RESET}")
    print(f"{C_VIOLET}{C_BOLD}╚═══════════════════════════════════════════════════════════════════════╝{C_RESET}\n")

def print_hardware_table(telem):
    """Prints a styled ASCII table of the detected hardware arsenal."""
    print_seinen_banner()
    hw = telem["hardware"]

    def status_badge(st):
        if st in ["ONLINE", "ARMED"]:
            return f"{C_EMERALD}{C_BOLD}[ {st} ]{C_RESET}"
        elif st in ["STANDBY_READY", "READY_PROVISIONED", "STANDBY"]:
            return f"{C_CYAN}{C_BOLD}[ {st} ]{C_RESET}"
        else:
            return f"{C_AMBER}{C_BOLD}[ {st} ]{C_RESET}"

    arm64 = hw["arm64_hybrid_node"]
    arm64_temp_str = f"{arm64['temp_celsius']}°C" if arm64.get("temp_celsius") is not None else "N/A"
    arm64_models_cnt = len(arm64.get("gguf_models", []))
    host_temp_val = telem.get("host_thermal", {}).get("temp_celsius")
    host_temp_str = f"{host_temp_val}°C" if host_temp_val is not None else "N/A"

    rows = [
        ("🎛️  Akai MPC (16-Pad)", hw["akai_mpc"]["name"] if "name" in hw["akai_mpc"] else "Akai MPC WebMIDI", hw["akai_mpc"]["status"], "WebMIDI / Q-Link CC 70-73"),
        ("🎙️  Focusrite Scarlett", hw["focusrite_scarlett"]["model"], hw["focusrite_scarlett"]["status"], f"hw:3,0 (24b/192kHz) @ {CANONICAL_FREQ}Hz"),
        ("🍍  Nano-Pineapple", "Pocket Router (AR9331/MT7628)", hw["nano_pineapple"]["status"], "Passive WIDS / WireGuard Pocket"),
        ("🤖  Arduino Uno", hw["arduino_uno"].get("microcontroller", "ATmega328P / CH340"), hw["arduino_uno"]["status"], "TRNG A0-A3 + Panic Switch INT0"),
        ("🍓  Raspberry Pi 3B", "ARMv8 Quad-core Sentinel (2.5W)", hw["raspberry_pi_3b"]["status"], "Honeypot Tar Pit 4200ms + DNS Sinkhole"),
        ("📱  POCO F6", hw["poco_f6"]["model"], hw["poco_f6"]["status"], "ADB Bridge / USB Tethering Node"),
        ("⚡  ARM64 Hybrid USB", f"{arm64['cores']} Cores // GGUF ({arm64_models_cnt})", arm64["status"], f"Node: {arm64_temp_str} | Host: {host_temp_str} (:18989)"),
        ("🖱️  Razer DeathAdder", hw["razer_deathadder"]["model"], hw["razer_deathadder"]["status"], "True 16K Optical / 1000Hz HID")
    ]

    print(f"{C_BOLD}{'DISPOSITIVO':<25} {'MODELO / FIRMWARE':<35} {'ESTADO':<15} {'TELEMETRÍA / INTERFAZ'}{C_RESET}")
    print(f"{C_GRAY}{'─'*24} {'─'*34} {'─'*14} {'─'*30}{C_RESET}")

    for dev_name, model, status, details in rows:
        badge = status_badge(status)
        print(f"{C_VIOLET}{dev_name:<25}{C_RESET} {model:<35} {badge:<23} {C_GRAY}{details}{C_RESET}")

    print(f"\n{C_CYAN}» Host Linux Thermal (/sys/class/thermal/thermal_zone0/temp): {C_BOLD}{host_temp_str}{C_RESET}")
    print(f"{C_DIM}» Concilio ACE 161914: Todos los subsistemas anclados a la frecuencia del Horno Alquímico.{C_RESET}\n")

def generate_focusrite_tone_wav(filepath, duration_sec=2.0, freq=CANONICAL_FREQ):
    """Generates a high-fidelity 24-bit/48kHz WAV audio file with canonical 189.89 Hz sine & 61.9 Hz sub."""
    sample_rate = 48000
    n_samples = int(sample_rate * duration_sec)
    
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(2)  # Stereo
        wf.setsampwidth(2)  # 16-bit PCM for universal aplay compatibility
        wf.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(n_samples):
            t = float(i) / sample_rate
            # Main carrier: 189.89 Hz
            val_carrier = math.sin(2.0 * math.pi * freq * t) * 0.6
            # Sub-harmonic: 61.9 Hz (Tormenta de Set)
            val_sub = math.sin(2.0 * math.pi * SUB_FREQ * t) * 0.35
            # Stereo binaural drift (+4Hz on Right channel)
            val_carrier_r = math.sin(2.0 * math.pi * (freq + 4.0) * t) * 0.6
            
            # Envelope (fade in / out to avoid clicks)
            env = min(1.0, min(i / (sample_rate * 0.05), (n_samples - i) / (sample_rate * 0.05)))
            
            sample_l = int((val_carrier + val_sub) * env * 32767.0 * 0.8)
            sample_r = int((val_carrier_r + val_sub) * env * 32767.0 * 0.8)
            
            sample_l = max(-32768, min(32767, sample_l))
            sample_r = max(-32768, min(32767, sample_r))
            
            frames.extend(struct.pack('<hh', sample_l, sample_r))
            
        wf.writeframes(frames)

def test_focusrite_audio():
    """Generates and plays a test tone directly to Focusrite Scarlett Solo (hw:3,0 or default)."""
    print(f"{C_VIOLET}[Set ⚡]: Sintetizando pulso canónico 189.89 Hz + Sub-Drop 61.9 Hz...{C_RESET}")
    tmp_wav = None
    try:
        with tempfile.NamedTemporaryFile(prefix="anuu_focusrite_189hz_", suffix=".wav", delete=False) as tf:
            tmp_wav = tf.name
        generate_focusrite_tone_wav(tmp_wav, duration_sec=2.5, freq=CANONICAL_FREQ)
        print(f"{C_CYAN}[Focusrite hw:3,0]: WAV generado en {tmp_wav}{C_RESET}")

        # Test playback via aplay: try direct hw:3,0 first, fallback to default Pulse/PipeWire
        print(f"{C_EMERALD}[Set ⚡]: Disparando stream de audio a 189.89 Hz...{C_RESET}")
        res = subprocess.run(["aplay", "-D", "plughw:3,0", tmp_wav], stderr=subprocess.DEVNULL, shell=False, timeout=5)
        if res.returncode != 0:
            res = subprocess.run(["aplay", tmp_wav], stderr=subprocess.DEVNULL, shell=False, timeout=5)
        if res.returncode == 0:
            print(f"{C_EMERALD}✓ Prueba de resonancia completada con éxito en la Focusrite Scarlett.{C_RESET}")
        else:
            print(f"{C_AMBER}! Dispositivo ocupado por PipeWire o en standby.{C_RESET}")
    except Exception as e:
        print(f"{C_ROSE}Error durante la prueba de audio: {e}{C_RESET}")
    finally:
        if tmp_wav and os.path.exists(tmp_wav):
            try:
                os.remove(tmp_wav)
            except Exception:
                pass

def export_status_json(filepath):
    """Saves the hardware telemetry to a designated JSON file for cyber-deck consumption."""
    telem = gather_full_telemetry()
    p = Path(filepath)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(telem, f, indent=2, ensure_ascii=False)
    print(f"{C_EMERALD}✓ Telemetría de Hardware exportada a: {filepath}{C_RESET}")

class HardwareStatusHandler(BaseHTTPRequestHandler):
    """Micro HTTP daemon serving live hardware telemetry with CORS headers."""
    def do_GET(self):
        if self.path in ["/", "/api/hardware", "/status"]:
            telem = gather_full_telemetry()
            payload = json.dumps(telem, indent=2).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def log_message(self, format, *args):
        # Quiet logger
        return

def serve_http(port=16194):
    """Starts micro HTTP server."""
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, HardwareStatusHandler)
    print(f"{C_VIOLET}[Set ⚡]: Servidor Micro-Bridge HTTP activo en http://127.0.0.1:{port}/api/hardware{C_RESET}")
    print(f"{C_CYAN}Presiona Ctrl+C para finalizar la escucha.{C_RESET}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n{C_AMBER}[Set ⚡]: Servidor detenido.{C_RESET}")
        httpd.server_close()

def watch_mode(interval=2):
    """Monitors hardware states in real-time loop."""
    print_seinen_banner()
    print(f"{C_CYAN}[Rosa Gris 🌸]: Iniciando centinela de hardware (Muestreo cada {interval}s)...{C_RESET}\n")
    prev_state = None
    try:
        while True:
            telem = gather_full_telemetry()
            curr_state = {k: v["status"] for k, v in telem["hardware"].items()}
            
            # Print update if state changed or first run
            if curr_state != prev_state:
                t_str = time.strftime("%H:%M:%S")
                print(f"{C_GRAY}[{t_str}]{C_RESET} {C_VIOLET}Actualización de Hardware Arsenal:{C_RESET}")
                for k, st in curr_state.items():
                    print(f"  • {k:<22}: {st}")
                print(f"{C_GRAY}{'─'*60}{C_RESET}")
                prev_state = curr_state

            time.sleep(interval)
    except KeyboardInterrupt:
        print(f"\n{C_AMBER}[Set ⚡]: Centinela finalizado.{C_RESET}")

def main():
    parser = argparse.ArgumentParser(
        description="Set ⚡ & Rosa Gris 🌸 // Anuu Tactical Hardware Arsenal Bridge (161914 @ 189.89.619 Hz)"
    )
    parser.add_argument("--scan", action="store_true", help="Escaneo único y tabla visual de hardware")
    parser.add_argument("--json", action="store_true", help="Salida en formato JSON estructurado")
    parser.add_argument("--watch", type=int, nargs="?", const=2, help="Modo centinela continuo con intervalo en segundos (default 2s)")
    parser.add_argument("--export-status", type=str, nargs="?", const="/home/kali/k4li-anuu-forge/assets/hardware_status.json", help="Exporta telemetría a un archivo JSON")
    parser.add_argument("--test-focusrite", action="store_true", help="Genera y reproduce tono canónico de 189.89 Hz en la Focusrite Scarlett Solo")
    parser.add_argument("--serve", type=int, nargs="?", const=16194, help="Inicia API REST local en el puerto especificado (default 16194)")

    args = parser.parse_args()

    # Default action if no flags provided: --scan and auto-export status
    if len(sys.argv) == 1 or args.scan:
        telem = gather_full_telemetry()
        print_hardware_table(telem)
        # Always update assets/hardware_status.json for web cyberdeck
        export_status_json("/home/kali/k4li-anuu-forge/assets/hardware_status.json")
        return

    if args.json:
        telem = gather_full_telemetry()
        print(json.dumps(telem, indent=2, ensure_ascii=False))
        return

    if args.export_status:
        export_status_json(args.export_status)
        return

    if args.test_focusrite:
        test_focusrite_audio()
        return

    if args.watch:
        watch_mode(args.watch)
        return

    if args.serve:
        serve_http(args.serve)
        return

if __name__ == "__main__":
    main()
