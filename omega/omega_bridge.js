/**
 * =============================================================================
 * ANUSET 189 OMEGA // ARGON ENGINE BRIDGE & TACTICAL CALIBRATOR
 * Frecuencia Operativa: 189.89.619 Hz | Concilio ACE (161914)
 * Arquitectura: Saze 🏛️
 * =============================================================================
 * 1. API Desacoplada de Montaje: window.AnusetOmegaHost.mountEngine(...)
 * 2. Port fiel de dice.go (2d20 Resonancia Prima, PrimeSet, Escalación FaultLevel)
 * 3. Port fiel de character.go, triad.go y bloodeater.go (SAN <15% Psicosis, Kilonova)
 * 4. Renderizador Vanilla Canvas 60 FPS: TheVoid (Esfera 3D + Retícula Ankh)
 * 5. Puente Argon Oracle -> Ollama Local (127.0.0.1:11434) con Fallback Seinen Offline
 */
(function () {
  'use strict';

  // ===========================================================================
  // 1. CONSTANTES CANÓNICAS (PORT DE engine_go/dice & engine_go/player)
  // ===========================================================================

  /**
   * Conjunto estricto de primos en un d20 según dice.go.
   * El 1 queda estrictamente excluido por definición matemática y arquitectura.
   * @type {ReadonlySet<number>}
   */
  const PRIME_SET = Object.freeze(new Set([2, 3, 5, 7, 11, 13, 17, 19]));

  /** @enum {number} */
  const FAULT_LEVEL = Object.freeze({
    NONE: 0,
    MINOR_SETBACK: 1,
    CRITICAL_ESCALATION: 2,
    HARD_FAULT: 3
  });

  /** @type {Readonly<Record<number, string>>} */
  const FAULT_DESCRIPTIONS = Object.freeze({
    0: 'ESTADO NOMINAL: Sin fallos acumulados',
    1: 'FALLO NIVEL 1: Contratiempo táctico menor (rotura de ítem secundario o pérdida de turno)',
    2: 'FALLO NIVEL 2: Escalación crítica (daño masivo al Agente y al escuadrón)',
    3: 'FALLO NIVEL 3: HARD FAULT / Muerte de sistema (desintegración irreversible de datos)'
  });

  /**
   * Bonificadores del Sistema de Tríada (triad.go)
   */
  const TRIAD_ROLES = Object.freeze({
    FISICO: {
      id: 'FISICO',
      label: 'FÍSICO',
      attackModifier: 2,
      critRangeMinimum: 19,
      armorClassBonus: 0,
      damageReduction: 0,
      spellSlotsBonus: 0,
      voidMagicUnlocked: false,
      summary: '+2 ATK · Crítico 19-20'
    },
    MAGIA: {
      id: 'MAGIA',
      label: 'MAGIA',
      attackModifier: 0,
      critRangeMinimum: 20,
      armorClassBonus: 0,
      damageReduction: 0,
      spellSlotsBonus: 2,
      voidMagicUnlocked: true,
      summary: '+2 Slots · Magia del Vacío'
    },
    DEFENSA: {
      id: 'DEFENSA',
      label: 'DEFENSA',
      attackModifier: 0,
      critRangeMinimum: 20,
      armorClassBonus: 2,
      damageReduction: 2,
      spellSlotsBonus: 0,
      voidMagicUnlocked: false,
      summary: '+2 AC · Mitigación RD 2'
    },
    HIBRIDO: {
      id: 'HIBRIDO',
      label: 'HÍBRIDO',
      attackModifier: 1,
      critRangeMinimum: 20,
      armorClassBonus: 1,
      damageReduction: 0,
      spellSlotsBonus: 0,
      voidMagicUnlocked: false,
      summary: '+1 ATK · +1 AC Versátil'
    }
  });

  /**
   * Artefactos Prohibidos Bloodeater canónicos (bloodeater.go)
   */
  const BLOODEATER_CATALOG = Object.freeze({
    none: null,
    katana: {
      key: 'katana',
      name: 'Katana de Cromo Goético',
      category: 'Arma',
      maxHpCost: 15,
      damageBonus: 5,
      omegaMultiplier: 3.0,
      hpRestoreOnKill: 10,
      sanityDrain: 0,
      immunePsychosis: false,
      description: '-15 HP_Max | +5 Daño Físico. En Éxito Omega: x3.0 daño y restaura +10 HP.'
    },
    canon: {
      key: 'canon',
      name: 'Cañón de Bitrate Sangriento',
      category: 'Arma',
      maxHpCost: 20,
      damageBonus: 8,
      omegaMultiplier: 2.5,
      hpRestoreOnKill: 5,
      sanityDrain: 5,
      immunePsychosis: false,
      description: '-20 HP_Max | +8 Daño Área, drena 5 SAN/disparo. En Éxito Omega: x2.5 daño.'
    },
    anillo: {
      key: 'anillo',
      name: 'Anillo de Ceniza 189Hz',
      category: 'Joya',
      maxHpCost: 10,
      damageBonus: 3,
      omegaMultiplier: 2.0,
      hpRestoreOnKill: 5,
      sanityDrain: 0,
      immunePsychosis: false,
      description: '-10 HP_Max | +3 Canalización del Vacío. En Éxito Omega: x2.0 daño y coste 0 MP.'
    },
    amuleto: {
      key: 'amuleto',
      name: 'Amuleto del Panteón Caído',
      category: 'Joya',
      maxHpCost: 25,
      damageBonus: 0,
      omegaMultiplier: 2.0,
      hpRestoreOnKill: 15,
      sanityDrain: 0,
      immunePsychosis: true,
      description: '-25 HP_Max | Inmunidad total a Psicosis (<15% SAN). En Éxito Omega: +15 HP.'
    }
  });

  // ===========================================================================
  // 2. MOTOR CRIPTOGRÁFICO 2d20 RESONANCIA PRIMA (PORT DE dice.go)
  // ===========================================================================

  /**
   * Genera un entero criptográficamente uniforme en [1, sides] sin sesgo de módulo.
   * Equivalente directo a CryptoRoller.Roll en dice.go.
   * @param {number} sides
   * @returns {number}
   */
  function cryptoRoll(sides) {
    if (sides <= 1) return 1;
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      const maxUint = 0xFFFFFFFF;
      const limit = maxUint - (maxUint % sides);
      let sample = 0;
      do {
        window.crypto.getRandomValues(array);
        sample = array[0];
      } while (sample >= limit);
      return (sample % sides) + 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  }

  class ArgonDiceEngine {
    constructor() {
      /** @type {number} */
      this.fumbleCount = 0;
      /** @type {number} */
      this.rollHistoryCount = 0;
    }

    /**
     * @param {number} n
     * @returns {boolean}
     */
    static isPrime(n) {
      return PRIME_SET.has(n);
    }

    /** @returns {number} */
    accumulatedFumbles() {
      return this.fumbleCount;
    }

    /** @returns {boolean} */
    isHardFault() {
      return this.fumbleCount >= 3;
    }

    /** Purga de fallos simulando Horno Alquímico 89 */
    resetFaults() {
      this.fumbleCount = 0;
    }

    /**
     * Ejecuta una tirada criptográfica 2d20 Resonancia Prima.
     * @param {number} targetDC
     * @param {number} modifier
     */
    roll(targetDC, modifier) {
      const d20A = cryptoRoll(20);
      const d20R = cryptoRoll(20);
      return this.evaluateRoll(d20A, d20R, targetDC, modifier);
    }

    /**
     * Evalúa valores fijos o aleatorios de 2d20 con determinismo puro.
     * @param {number} d20A Dado de Acción (1..20)
     * @param {number} d20R Dado de Resonancia Prima (1..20)
     * @param {number} targetDC Clase de Dificultad objetivo
     * @param {number} modifier Modificador táctico total
     */
    evaluateRoll(d20A, d20R, targetDC, modifier) {
      this.rollHistoryCount += 1;

      const isActionPrime = ArgonDiceEngine.isPrime(d20A);
      const isOmegaSuccess = ArgonDiceEngine.isPrime(d20R);
      const isDoublePrime = isActionPrime && isOmegaSuccess;

      const res = {
        rollIndex: this.rollHistoryCount,
        actionDie: d20A,
        resonanceDie: d20R,
        targetDC: targetDC,
        modifier: modifier,
        totalAction: d20A + modifier,
        isActionPrime: isActionPrime,
        isSuccess: false,
        isOmegaSuccess: isOmegaSuccess,
        isDoublePrime: isDoublePrime,
        isCriticalFumble: false,
        fumbleStreak: this.fumbleCount,
        faultLevel: FAULT_LEVEL.NONE,
        faultDescription: FAULT_DESCRIPTIONS[0],
        detail: ''
      };

      // 1. Chequeo de Pifia Crítica (d20_A == 1 tiene precedencia absoluta según dice.go)
      if (d20A === 1) {
        res.isCriticalFumble = true;
        res.isOmegaSuccess = false;
        res.isDoublePrime = false;
        this.fumbleCount += 1;
        res.fumbleStreak = this.fumbleCount;

        if (this.fumbleCount === 1) {
          res.faultLevel = FAULT_LEVEL.MINOR_SETBACK;
        } else if (this.fumbleCount === 2) {
          res.faultLevel = FAULT_LEVEL.CRITICAL_ESCALATION;
        } else {
          res.faultLevel = FAULT_LEVEL.HARD_FAULT;
        }
        res.faultDescription = FAULT_DESCRIPTIONS[res.faultLevel];
        res.isSuccess = false;
        res.detail = `PIFIA CRÍTICA [d20_A=1] — ${res.faultDescription}`;
        return res;
      }

      // 2. Estado de fallos previos acumulados
      if (res.fumbleStreak > 0) {
        res.faultLevel = Math.min(3, res.fumbleStreak);
        res.faultDescription = FAULT_DESCRIPTIONS[res.faultLevel];
      }

      // 3. Regla de DC Imposible (DC >= 25): exige Éxito Omega
      if (targetDC >= 25) {
        if (res.isDoublePrime) {
          res.isSuccess = true;
          res.detail = `☥ SINGULARIDAD DOBLE PRIMO [${d20A} & ${d20R}] ⚡: Quebró DC ${targetDC} imposible con Resonancia Dual. Blindaje anulado y sobrecarga crítica.`;
        } else if (res.isOmegaSuccess) {
          res.isSuccess = true;
          res.detail = `⚡ ÉXITO OMEGA: Superó DC ${targetDC} imposible mediante Resonancia Prima [d20_R=${d20R}]. Ignora blindaje.`;
        } else {
          res.isSuccess = false;
          res.detail = `FALLO: DC ${targetDC} requiere Éxito Omega (d20_R primo). Acción total ${res.totalAction} insuficiente.`;
        }
        return res;
      }

      // 4. Regla Estándar: TotalAction >= TargetDC O Éxito Omega
      if (res.totalAction >= targetDC || res.isOmegaSuccess) {
        res.isSuccess = true;
        if (res.isDoublePrime) {
          res.detail = `☥ DOBLE PRIMO [${d20A} & ${d20R}] // ÉXITO OMEGA SUPREMO ⚡: Resonancia armónica 189Hz. Daño sobrecargado y armadura pulverizada.`;
        } else if (res.isOmegaSuccess) {
          res.detail = `⚡ ÉXITO OMEGA: Resonancia Prima activa [d20_R=${d20R} primo]. Daño multiplicado y armadura ignorada.`;
        } else {
          res.detail = `ÉXITO ESTÁNDAR: Acción total ${res.totalAction} (${d20A}+${modifier}) >= DC ${targetDC}.`;
        }
      } else {
        res.isSuccess = false;
        res.detail = `FALLO TÁCTICO: Acción total ${res.totalAction} < DC ${targetDC} (sin Resonancia Prima en d20_R=${d20R}).`;
      }

      return res;
    }
  }

  // ===========================================================================
  // 3. AGENTE & BIOMETRÍA SEINEN (PORT DE character.go & bloodeater.go)
  // ===========================================================================

  class ArgonCharacter {
    constructor(name, roleKey = 'FISICO') {
      this.name = name;
      this.isLeader = true;
      this.baseHpMax = 100;
      this.baseSanMax = 100;
      this.sanMax = 100;
      this.mpMax = 60;

      this.hpMax = 100;
      this.hp = 100;
      this.san = 88;
      this.mp = 60;

      this.dataScars = 0;
      this.kilonovaBlessingReady = true;
      this.isAlive = true;
      this.triadSynergyActive = true; // +3 de party.go HasTriadSynergy()

      /** @type {typeof BLOODEATER_CATALOG['katana'] | null} */
      this.bloodeater = null;
      this.role = TRIAD_ROLES[roleKey] || TRIAD_ROLES.FISICO;

      // Vínculos del Códice Canónico (144 Clases × 12 Facciones)
      this.activeClass = null;
      this.activeFaction = null;
      this.hasFactionClassSynergy = false;
      this.bloodeaterCostReduction = 0;
      this.voidAffinityPct = 35;

      this.recalculateStats();
      this.equipBloodeater('katana');
    }

    recalculateStats() {
      const b = this.role;
      const cMods = this.activeClass && this.activeClass.mods
        ? this.activeClass.mods
        : { atk: 0, ac: 0, hp_max_delta: 0, san_max_delta: 0, bloodeater_cost_reduction: 0, void_affinity: 35 };
      const fMods = this.activeFaction && this.activeFaction.mods
        ? this.activeFaction.mods
        : { atk: 0, ac: 0, hp_max_delta: 0, san_max_delta: 0, void_affinity_delta: 0 };

      let hasSynergy = false;
      if (this.activeClass && this.activeFaction) {
        const resArch = Array.isArray(this.activeFaction.resonant_archetypes)
          ? this.activeFaction.resonant_archetypes
          : [];
        const resPil = Array.isArray(this.activeFaction.resonant_pillars)
          ? this.activeFaction.resonant_pillars
          : [];
        hasSynergy =
          resArch.includes(this.activeClass.archetype) ||
          resPil.includes(this.activeClass.pillar);
      }
      this.hasFactionClassSynergy = hasSynergy;
      this.bloodeaterCostReduction = cMods.bloodeater_cost_reduction || 0;

      const rawItemCost = this.bloodeater ? this.bloodeater.maxHpCost : 0;
      const effectiveItemCost = this.bloodeater
        ? Math.max(0, rawItemCost - this.bloodeaterCostReduction)
        : 0;
      const itemDmg = this.bloodeater ? this.bloodeater.damageBonus : 0;
      const synergyAtk = hasSynergy ? 1 : 0;
      const synergyVoid = hasSynergy ? 5 : 0;

      const prevSanRatio = this.sanMax > 0 ? this.san / this.sanMax : 0.88;
      this.sanMax = Math.max(40, this.baseSanMax + (cMods.san_max_delta || 0) + (fMods.san_max_delta || 0));
      this.san = Math.max(0, Math.min(this.sanMax, Math.round(this.sanMax * prevSanRatio)));

      this.hpMax = Math.max(
        15,
        this.baseHpMax + (cMods.hp_max_delta || 0) + (fMods.hp_max_delta || 0) - effectiveItemCost
      );
      if (this.hp > this.hpMax) this.hp = this.hpMax;

      this.armorClass = Math.max(
        8,
        10 + b.armorClassBonus + (cMods.ac || 0) + (fMods.ac || 0) - this.dataScars
      );
      this.attackBonus = Math.max(
        0,
        b.attackModifier + itemDmg + (cMods.atk || 0) + (fMods.atk || 0) + synergyAtk - this.dataScars
      );
      this.critThreshold = b.critRangeMinimum;
      this.damageReduction = b.damageReduction;
      this.voidAffinityPct = Math.max(
        5,
        Math.min(99, (cMods.void_affinity || 35) + (fMods.void_affinity_delta || 0) + synergyVoid)
      );
    }

    /**
     * Vincula una de las 144 Clases Modulares y una de las 12 Facciones Canónicas al Agente activo.
     * @param {object | null} classObj
     * @param {object | null} factionObj
     */
    applyCodexBuild(classObj, factionObj) {
      const prevHpRatio = this.hpMax > 0 ? this.hp / this.hpMax : 1;
      if (classObj) {
        this.activeClass = classObj;
        if (classObj.triad && TRIAD_ROLES[classObj.triad]) {
          this.role = TRIAD_ROLES[classObj.triad];
        }
      }
      if (factionObj) {
        this.activeFaction = factionObj;
      }
      this.recalculateStats();
      if (this.isAlive) {
        this.hp = Math.max(1, Math.min(this.hpMax, Math.round(this.hpMax * prevHpRatio)));
      }
    }

    setRole(roleKey) {
      if (!TRIAD_ROLES[roleKey]) return;
      this.role = TRIAD_ROLES[roleKey];
      this.recalculateStats();
    }

    equipBloodeater(key) {
      const item = BLOODEATER_CATALOG[key] || null;
      const prevRatio = this.hpMax > 0 ? this.hp / this.hpMax : 1;
      this.bloodeater = item;
      this.recalculateStats();
      if (this.isAlive) {
        this.hp = Math.max(1, Math.round(this.hpMax * prevRatio));
      }
    }

    /** @returns {number} 0..100 */
    sanityPercentage() {
      if (this.sanMax <= 0) return 0;
      return (this.san / this.sanMax) * 100;
    }

    /**
     * Port exacto de Character.IsPsychosisActive() en character.go:
     * Umbral estricto < 15% SAN, salvo inmunidad por Amuleto del Panteón Caído.
     * @returns {boolean}
     */
    isPsychosisActive() {
      if (this.bloodeater && this.bloodeater.immunePsychosis) {
        return false;
      }
      if (this.sanMax <= 0) return true;
      return (this.san / this.sanMax) < 0.15;
    }

    setSanity(value) {
      const clamped = Math.max(0, Math.min(this.sanMax, Math.round(value)));
      this.san = clamped;
      return this.isPsychosisActive();
    }

    applySanityDamage(amount) {
      if (!this.isAlive || amount <= 0) return this.isPsychosisActive();
      this.san = Math.max(0, this.san - amount);
      return this.isPsychosisActive();
    }

    /**
     * Port exacto de Character.ApplyDamage() con rescate de Bendición de Kilonova.
     * @param {number} incomingDmg
     */
    applyDamage(incomingDmg) {
      if (!this.isAlive) {
        return {
          incomingDamage: incomingDmg,
          mitigatedDamage: 0,
          effectiveDamage: 0,
          remainingHp: 0,
          fatalDamage: true,
          kilonovaTriggered: false,
          narrative: `${this.name} ya yace desintegrada en el Vacío. Purga en el Horno Alquímico 89 para reiniciar.`
        };
      }

      const mitigated = Math.min(incomingDmg, this.damageReduction);
      const effective = Math.max(0, incomingDmg - mitigated);
      const remHp = this.hp - effective;

      if (remHp <= 0) {
        if (this.isLeader && this.kilonovaBlessingReady) {
          const recalibrated = Math.max(1, Math.floor(this.hpMax / 2));
          this.hp = recalibrated;
          this.kilonovaBlessingReady = false;
          return {
            incomingDamage: incomingDmg,
            mitigatedDamage: mitigated,
            effectiveDamage: effective,
            remainingHp: this.hp,
            fatalDamage: false,
            kilonovaTriggered: true,
            narrative: `☥ ¡BENDICIÓN DE KILONOVA ACTIVADA! El núcleo de ${this.name} se recalibra ante el impacto letal de ${effective} DMG. HP restaurado al 50% (${this.hp}/${this.hpMax}).`
          };
        }

        this.hp = 0;
        this.isAlive = false;
        return {
          incomingDamage: incomingDmg,
          mitigatedDamage: mitigated,
          effectiveDamage: effective,
          remainingHp: 0,
          fatalDamage: true,
          kilonovaTriggered: false,
          narrative: `☠️ CRÍTICO FATAL: ${this.name} ha caído sin Bendición de Kilonova disponible. Ejecuta Purga en Horno 89.`
        };
      }

      this.hp = remHp;
      return {
        incomingDamage: incomingDmg,
        mitigatedDamage: mitigated,
        effectiveDamage: effective,
        remainingHp: this.hp,
        fatalDamage: false,
        kilonovaTriggered: false,
        narrative: `Impacto recibido: ${effective} DMG efectivo (${mitigated} mitigado). HP: ${this.hp}/${this.hpMax}.`
      };
    }

    /**
     * Port de CalculateBloodeaterStrike & ExecuteBloodeaterAttack
     */
    executeStrike(baseDmg, isOmegaSuccess, isDoublePrime) {
      if (!this.isAlive) return null;
      const item = this.bloodeater;
      const bonus = item ? item.damageBonus : this.attackBonus;
      let mult = 1.0;
      let restored = 0;

      if (isOmegaSuccess) {
        mult = item ? item.omegaMultiplier : 2.0;
        if (isDoublePrime) mult += 0.5;
        restored = item ? item.hpRestoreOnKill : 4;
      }

      const totalDamage = Math.round((baseDmg + bonus) * mult);
      const sanCost = item ? item.sanityDrain : 0;

      if (sanCost > 0) {
        this.san = Math.max(0, this.san - sanCost);
      }
      if (restored > 0) {
        this.hp = Math.min(this.hpMax, this.hp + restored);
      }

      const weaponLabel = item ? item.name : 'Filo Táctico Estándar';
      let narrative = `[${weaponLabel}] descargó ${totalDamage} DMG`;
      if (isOmegaSuccess) {
        narrative += ` (x${mult.toFixed(1)} Omega · +${restored} HP drenados)`;
      }
      if (sanCost > 0) {
        narrative += ` [-${sanCost} SAN]`;
      }

      return {
        weaponLabel,
        totalDamage,
        multiplier: mult,
        hpRestored: restored,
        sanityCost: sanCost,
        narrative
      };
    }

    /**
     * Horno Alquímico 89 (619 Hz): restaura vitalidad, cordura, purga DataScars y recarga Kilonova.
     */
    purgeAtAlchemicalOven89() {
      this.isAlive = true;
      this.dataScars = 0;
      this.recalculateStats();
      this.hp = this.hpMax;
      this.san = this.sanMax;
      this.mp = this.mpMax;
      this.kilonovaBlessingReady = true;
    }

    totalTacticalModifier() {
      const synergy = this.triadSynergyActive ? 3 : 0;
      const psychosisPenalty = this.isPsychosisActive() ? -2 : 0;
      return this.attackBonus + synergy + psychosisPenalty;
    }
  }

  // ===========================================================================
  // 4. THE VOID — MOTOR ATMOSFÉRICO 60 FPS EN VANILLA CANVAS (PORT DE Void.tsx)
  // ===========================================================================

  class TheVoidCanvasRenderer {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.running = false;
      this.rafId = null;
      this.width = 0;
      this.height = 0;
      this.lastTime = 0;
      this.rotX = 0;
      this.rotY = 0;
      this.pulsePhase = 0;

      // Estados reactivos desde el motor táctico
      this.psychosisMode = false;
      this.hardFaultMode = false;
      this.shockwaves = [];

      // Generar nube esférica 3D de partículas (inspirado en Void.tsx StarField radius 2.2)
      this.stars = [];
      const count = 620;
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 2.2;

        const paletteRoll = Math.random();
        let color = '#8A2BE2'; // Púrpura abisal predominante
        if (paletteRoll > 0.86) color = '#00f5d4'; // Cian Anuu
        else if (paletteRoll > 0.95) color = '#fbbf24'; // Oro Kilonova

        this.stars.push({
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
          baseSize: 0.7 + Math.random() * 1.6,
          color: color
        });
      }

      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);
      this.resize();
    }

    resize() {
      if (!this.canvas || !this.canvas.parentElement) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = Math.max(320, rect.width);
      this.height = Math.max(240, rect.height);
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    /**
     * Dispara una onda expansiva en el Vacío al lograr Éxito Omega, Doble Primo o Kilonova.
     * @param {'omega'|'double'|'fumble'|'kilonova'} kind
     */
    triggerPulse(kind) {
      const palette = {
        omega: '#00f5d4',
        double: '#fbbf24',
        fumble: '#ff1e56',
        kilonova: '#fbbf24'
      };
      this.shockwaves.push({
        radius: 18,
        maxRadius: Math.min(this.width, this.height) * 0.58,
        alpha: 0.92,
        color: palette[kind] || '#00f5d4',
        doubleRing: kind === 'double' || kind === 'kilonova'
      });
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.renderFrame(dt);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    renderFrame(dt) {
      const ctx = this.ctx;
      if (!ctx) return;

      const w = this.width;
      const h = this.height;
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Fondo Niebla Abisal (#050508)
      ctx.fillStyle = this.psychosisMode ? 'rgba(9, 3, 8, 0.34)' : 'rgba(5, 5, 8, 0.42)';
      ctx.fillRect(0, 0, w, h);

      // Halo radial central sutil
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.55);
      if (this.psychosisMode || this.hardFaultMode) {
        grad.addColorStop(0, 'rgba(255, 30, 86, 0.11)');
        grad.addColorStop(0.5, 'rgba(138, 43, 226, 0.06)');
        grad.addColorStop(1, 'rgba(5, 5, 8, 0)');
      } else {
        grad.addColorStop(0, 'rgba(138, 43, 226, 0.11)');
        grad.addColorStop(0.45, 'rgba(0, 245, 212, 0.04)');
        grad.addColorStop(1, 'rgba(5, 5, 8, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Velocidad angular (Void.tsx: delta/10 y delta/15; acelerada en Psicosis)
      const speedMult = this.psychosisMode ? 3.4 : 1.0;
      this.rotX -= (dt / 10) * speedMult;
      this.rotY -= (dt / 15) * speedMult;
      this.pulsePhase += dt * (this.psychosisMode ? 7.5 : 2.1);

      const cosX = Math.cos(this.rotX);
      const sinX = Math.sin(this.rotX);
      const cosY = Math.cos(this.rotY);
      const sinY = Math.sin(this.rotY);

      const fov = Math.min(w, h) * 0.48;
      const camDist = 3.1;

      // Proyección 3D de partículas
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];

        // Rotación Y luego X
        const x1 = s.x * cosY - s.z * sinY;
        const z1 = s.z * cosY + s.x * sinY;
        const y2 = s.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + s.y * sinX;

        const depth = camDist + z2;
        if (depth <= 0.2) continue;

        const scale = fov / depth;
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;

        const size = Math.max(0.5, s.baseSize * (1.8 / depth));
        const alpha = Math.min(0.95, Math.max(0.15, (2.6 - z2) / 3.8));

        ctx.globalAlpha = alpha;
        if (this.psychosisMode && i % 4 === 0) {
          // Desdoblamiento cromático RGB real en las partículas
          ctx.fillStyle = '#ff1e56';
          ctx.fillRect(px - 2.5, py, size, size);
          ctx.fillStyle = '#00f5d4';
          ctx.fillRect(px + 2.5, py, size, size);
        } else {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Retícula Sagrada Central: Ankh Ciber-Goético + Anillo de 12 Pilares
      this.drawSacredAnkhReticle(ctx, cx, cy);

      // Ondas de choque tácticas
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += dt * 420;
        sw.alpha -= dt * 1.15;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          this.shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (sw.doubleRing && sw.radius > 24) {
          ctx.globalAlpha = Math.max(0, sw.alpha * 0.6);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, sw.radius * 0.76, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Rasgado horizontal ocasional en Modo Psicosis (<15% SAN)
      if (this.psychosisMode && Math.random() < 0.24) {
        const sliceY = Math.random() * h;
        const sliceH = 2 + Math.random() * 10;
        const shiftX = (Math.random() - 0.5) * 28;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 30, 86, 0.16)' : 'rgba(0, 245, 212, 0.14)';
        ctx.fillRect(Math.max(0, shiftX), sliceY, w, sliceH);
      }
    }

    drawSacredAnkhReticle(ctx, cx, cy) {
      const breath = Math.sin(this.pulsePhase) * 4;
      const baseR = Math.min(this.width, this.height) * 0.14 + breath;
      const jitterX = this.psychosisMode ? (Math.random() - 0.5) * 5 : 0;
      const jitterY = this.psychosisMode ? (Math.random() - 0.5) * 5 : 0;

      ctx.save();
      ctx.translate(cx + jitterX, cy + jitterY);

      // Anillo exterior de los 12 Pilares Divinos
      ctx.strokeStyle = this.psychosisMode ? 'rgba(255, 30, 86, 0.35)' : 'rgba(138, 43, 226, 0.32)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 12 marcas de pilar girando lentamente
      for (let p = 0; p < 12; p++) {
        const ang = (p * Math.PI) / 6 + this.rotY * 0.6;
        const xA = Math.cos(ang) * (baseR - 5);
        const yA = Math.sin(ang) * (baseR - 5);
        const xB = Math.cos(ang) * (baseR + 5);
        const yB = Math.sin(ang) * (baseR + 5);
        ctx.strokeStyle = p % 3 === 0 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(0, 245, 212, 0.35)';
        ctx.beginPath();
        ctx.moveTo(xA, yA);
        ctx.lineTo(xB, yB);
        ctx.stroke();
      }

      // Emblema Ankh Vectorial en el corazón del Vacío
      const ankhColor = this.psychosisMode ? 'rgba(255, 30, 86, 0.55)' : 'rgba(0, 245, 212, 0.38)';
      ctx.strokeStyle = ankhColor;
      ctx.lineWidth = 1.6;

      // Lazo superior del Ankh
      ctx.beginPath();
      ctx.arc(0, -14, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Eje vertical y travesaño
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 22);
      ctx.moveTo(-13, 3);
      ctx.lineTo(13, 3);
      ctx.stroke();

      // Punto de singularidad Kilonova
      ctx.fillStyle = this.psychosisMode ? '#ff1e56' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 3, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ===========================================================================
  // 5. ARGON ORACLE BRIDGE (OLLAMA LOCAL 127.0.0.1:11434 + FALLBACK SEINEN 0 €)
  // ===========================================================================

  class ArgonOracleBridge {
    constructor() {
      this.candidates = [
        { base: 'http://127.0.0.1:18989', label: 'Edge ARM64 Hybrid (:18989)' },
        { base: 'http://127.0.0.1:11434', label: 'Host Ollama (:11434)' }
      ];
      this.endpoint = 'http://127.0.0.1:18989/api/generate';
      this.tagsEndpoint = 'http://127.0.0.1:18989/api/tags';
      this.model = 'anuu-3b';
      this.online = false;
      this.lastLatencyMs = 0;
    }

    async probe() {
      for (const cand of this.candidates) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1100);
        const t0 = performance.now();
        try {
          const res = await fetch(`${cand.base}/api/tags`, {
            method: 'GET',
            signal: ctrl.signal
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            this.endpoint = `${cand.base}/api/generate`;
            this.tagsEndpoint = `${cand.base}/api/tags`;
            this.online = true;
            this.lastLatencyMs = Math.round(performance.now() - t0);
            if (data && Array.isArray(data.models) && data.models.length > 0) {
              const names = data.models.map((m) => m.name);
              const preferred = names.find((n) => n.includes('anuu')) || names[0];
              if (preferred) this.model = preferred;
            }
            return { online: true, model: `${this.model} · ${cand.label}`, latencyMs: this.lastLatencyMs };
          }
        } catch (_err) {
          clearTimeout(timer);
        }
      }
      this.online = false;
      return { online: false, model: `${this.model} (Fallback Códice Local)`, latencyMs: 0 };
    }

    /**
     * Consulta a Ollama local o sintetiza respuesta Seinen instantánea si está offline.
     * @param {string} userPrompt
     * @param {object} ctx
     */
    async narrate(userPrompt, ctx) {
      const systemDirective =
        'Eres ARGON ORACLE (ANUU_BRUMA), Game Master Seinen ciber-goético de ANUSET 189 OMEGA (189.89.619 Hz). ' +
        'Responde en español, máximo 2 frases quirúrgicas, oscuras y atmosféricas.';

      const enrichedPrompt =
        `[TELEMETRÍA: Agente=${ctx.agentName}, Tríada=${ctx.role}, HP=${ctx.hp}/${ctx.hpMax}, ` +
        `SAN=${ctx.sanPct}%, Psicosis=${ctx.psychosis ? 'ACTIVA' : 'NO'}, Evento=${userPrompt}]`;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4200);
      const t0 = performance.now();

      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            system: systemDirective,
            prompt: enrichedPrompt,
            stream: false,
            options: { temperature: 0.75, num_predict: 110 }
          }),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const payload = await res.json();
          if (payload && payload.response) {
            this.online = true;
            this.lastLatencyMs = Math.round(performance.now() - t0);
            return {
              source: `OLLAMA LIVE · ${this.model} (${this.lastLatencyMs}ms)`,
              text: payload.response.trim()
            };
          }
        }
      } catch (_err) {
        // Fallback inmediato offline
      }
      clearTimeout(timer);
      this.online = false;

      return {
        source: 'CÓDICE OMEGA OFFLINE · 0ms',
        text: this.synthesizeOfflineNarrative(userPrompt, ctx)
      };
    }

    synthesizeOfflineNarrative(prompt, ctx) {
      const p = (prompt || '').toLowerCase();

      if (ctx.psychosis) {
        const psychoLines = [
          'La niebla de 619 Hz sangra en los bordes de tu córnea; Anuu corta la telemetría asistida y los muros del Sector 89 respiran tu propio nombre.',
          'Con la cordura quebrada bajo el 15%, las sombras del Psycho Pantheon superponen tres geometrías imposibles sobre el blanco táctico.',
          'El pulso cromático desdobla el filo Bloodeater: ya no distingues si la vibración proviene del Vacío o de tus propias sinapsis.'
        ];
        return psychoLines[Math.floor(Math.random() * psychoLines.length)];
      }

      if (p.includes('doble primo')) {
        return '☥ Singularidad armónica: ambos icosaedros clavan frecuencia prima en el tejido del Vacío, desintegrando el blindaje enemigo como ceniza vítrea.';
      }
      if (p.includes('éxito omega') || p.includes('omega')) {
        return '⚡ El Dado de Resonancia sintoniza un armónico primo puro; la herida ignora toda cobertura física y drena icor vital hacia tu núcleo.';
      }
      if (p.includes('hard fault') || p.includes('nivel 3')) {
        return '☢️ HARD FAULT: tres unos naturales han saturado el bus neural. La memoria táctica colapsa; solo el Horno Alquímico 89 puede reconstruir el chasis.';
      }
      if (p.includes('pifia')) {
        return '⚠️ Ruido blanco en el canal de acción: el golpe rebota contra cromo muerto y abre una cicatriz de datos en la guardia del escuadrón.';
      }
      if (p.includes('kilonova')) {
        return '🌟 Cuando el golpe letal iba a borrar tu firma biométrica, la Bendición de Kilonova incendia el Vacío y reensambla tu alma al cincuenta por ciento.';
      }
      if (p.includes('horno')) {
        return '🔥 Las brasas a 619 Hz del Horno Alquímico 89 calcinan toda cicatriz de datos; tu cordura y el privilegio de Kilonova renacen intactos.';
      }

      return `«${prompt}» — El radar de Anuu escanea la penumbra del Año 10 (SAN ${ctx.sanPct}%, Tríada ${ctx.role}): el pasillo de obsidiana aguarda tu siguiente corte.`;
    }
  }

  // ===========================================================================
  // 5B. CÓDICE CANÓNICO: 144 CLASES MODULARES & 12 FACCIONES UNIFICADAS
  //     (Carga local fetch('codex_144.json') + Fallback embebido resiliente file://)
  // ===========================================================================

  const EMBEDDED_ARCHETYPES = Object.freeze([
    { name: 'Guerrero de Cromo', role: 'FÍSICO-Ofensivo', triad: 'FISICO', stat: 'FUE', passive: 'Golpe Crítico ampliado (19-20)', mods: { atk: 2, ac: 0, hp_max_delta: 5, san_max_delta: 0, bloodeater_cost_reduction: 0, base_void_affinity: 28 } },
    { name: 'Centinela Djed', role: 'DEFENSA-Tanque', triad: 'DEFENSA', stat: 'CON', passive: 'Reducción de Daño +2 pasivo', mods: { atk: 0, ac: 2, hp_max_delta: 12, san_max_delta: 0, bloodeater_cost_reduction: 0, base_void_affinity: 22 } },
    { name: 'Tejedor del Vacío', role: 'MAGIA-Control', triad: 'MAGIA', stat: 'INT', passive: 'Acceso anticipado a Void Magic', mods: { atk: 2, ac: 0, hp_max_delta: -4, san_max_delta: 6, bloodeater_cost_reduction: 0, base_void_affinity: 76 } },
    { name: 'Exorcista de Bitrate', role: 'MAGIA-Purificación', triad: 'MAGIA', stat: 'SAB', passive: 'Limpieza de estados negativos', mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 10, bloodeater_cost_reduction: 0, base_void_affinity: 54 } },
    { name: 'Chatarrero Reciclador', role: 'HÍBRIDO-Utilidad', triad: 'HIBRIDO', stat: 'DES', passive: '+2 a /craft y reparación', mods: { atk: 1, ac: 1, hp_max_delta: 6, san_max_delta: 2, bloodeater_cost_reduction: 2, base_void_affinity: 34 } },
    { name: 'Asesino de Frecuencia', role: 'FÍSICO-Sigilo', triad: 'FISICO', stat: 'DES', passive: 'Primer golpe garantizado si no detectado', mods: { atk: 3, ac: 1, hp_max_delta: -4, san_max_delta: 0, bloodeater_cost_reduction: 0, base_void_affinity: 48 } },
    { name: 'Oráculo Goético', role: 'MAGIA-Adivinación', triad: 'MAGIA', stat: 'SAB', passive: 'Predicción de Lair Actions 1 turno antes', mods: { atk: 1, ac: 1, hp_max_delta: -2, san_max_delta: 8, bloodeater_cost_reduction: 0, base_void_affinity: 68 } },
    { name: 'Ingeniero de la Forja', role: 'HÍBRIDO-Crafting', triad: 'HIBRIDO', stat: 'INT', passive: 'Mejora de Bloodeaters sin coste extra', mods: { atk: 1, ac: 1, hp_max_delta: 4, san_max_delta: 0, bloodeater_cost_reduction: 4, base_void_affinity: 40 } },
    { name: 'Berserker Bloodeater', role: 'FÍSICO-Sacrificio', triad: 'FISICO', stat: 'FUE', passive: 'Bloodeaters cuestan -5 HP_Max menos', mods: { atk: 3, ac: -1, hp_max_delta: 8, san_max_delta: -5, bloodeater_cost_reduction: 5, base_void_affinity: 62 } },
    { name: 'Médico de Almas', role: 'DEFENSA-Curación', triad: 'DEFENSA', stat: 'SAB', passive: 'Curación de SAN +5 por descanso largo', mods: { atk: 0, ac: 1, hp_max_delta: 6, san_max_delta: 12, bloodeater_cost_reduction: 0, base_void_affinity: 38 } },
    { name: 'Hacker de Resonancia', role: 'HÍBRIDO-Soporte', triad: 'HIBRIDO', stat: 'INT', passive: 'Interfiere tiradas enemigas (-1 a su d20)', mods: { atk: 2, ac: 1, hp_max_delta: 0, san_max_delta: 4, bloodeater_cost_reduction: 0, base_void_affinity: 58 } },
    { name: 'Invocador del Panteón', role: 'MAGIA-Invocación', triad: 'MAGIA', stat: 'CAR', passive: 'Puede invocar ecos de deidades menores', mods: { atk: 2, ac: 0, hp_max_delta: -2, san_max_delta: 5, bloodeater_cost_reduction: 0, base_void_affinity: 72 } }
  ]);

  const EMBEDDED_PILLARS = Object.freeze([
    { deity: 'Anubis', pillar: 'Pilar de Anubis', domain: 'Muerte & Tránsito', bonus: '+2 SAN contra horror', mods: { atk: 0, ac: 1, hp_max_delta: 0, san_max_delta: 6, void_affinity_delta: 10 } },
    { deity: 'Thoth', pillar: 'Pilar de Thoth', domain: 'Conocimiento & Alquimia', bonus: '+2 INT para identificación', mods: { atk: 1, ac: 0, hp_max_delta: 0, san_max_delta: 4, void_affinity_delta: 8 } },
    { deity: 'Sekhmet', pillar: 'Pilar de Sekhmet', domain: 'Guerra & Destrucción', bonus: '+2 daño cuerpo a cuerpo', mods: { atk: 2, ac: 0, hp_max_delta: 4, san_max_delta: -2, void_affinity_delta: 6 } },
    { deity: 'Isis', pillar: 'Pilar de Isis', domain: 'Curación & Protección', bonus: '+2 curación recibida', mods: { atk: 0, ac: 1, hp_max_delta: 8, san_max_delta: 4, void_affinity_delta: 2 } },
    { deity: 'Set', pillar: 'Pilar de Set', domain: 'Caos & Rebelión', bonus: '+2 a pifias convertidas en ventaja', mods: { atk: 2, ac: 0, hp_max_delta: 0, san_max_delta: -3, void_affinity_delta: 14 } },
    { deity: 'Maat', pillar: 'Pilar de Maat', domain: 'Justicia & Equilibrio', bonus: '+2 Karma y resolución de conflictos', mods: { atk: 1, ac: 1, hp_max_delta: 2, san_max_delta: 4, void_affinity_delta: -4 } },
    { deity: 'Hathor', pillar: 'Pilar de Hathor', domain: 'Arte & Frecuencia', bonus: '+2 a tiradas de Carisma y moral', mods: { atk: 1, ac: 0, hp_max_delta: 2, san_max_delta: 6, void_affinity_delta: 6 } },
    { deity: 'Horus', pillar: 'Pilar de Horus', domain: 'Visión & Estrategia', bonus: '+2 a /examine y /whois', mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 2, void_affinity_delta: 4 } },
    { deity: 'Osiris', pillar: 'Pilar de Osiris', domain: 'Resurrección & Ciclo', bonus: 'Bendición de Kilonova recarga 1 turno antes', mods: { atk: 0, ac: 1, hp_max_delta: 6, san_max_delta: 4, void_affinity_delta: 8 } },
    { deity: 'Bastet', pillar: 'Pilar de Bastet', domain: 'Sigilo & Instinto', bonus: '+2 a iniciativa y evasión', mods: { atk: 1, ac: 2, hp_max_delta: 0, san_max_delta: 0, void_affinity_delta: 5 } },
    { deity: 'Ra', pillar: 'Pilar de Ra', domain: 'Fuego & Radiación', bonus: '+2 daño de fuego/energía', mods: { atk: 2, ac: 0, hp_max_delta: 2, san_max_delta: 0, void_affinity_delta: 7 } },
    { deity: 'Anuu', pillar: 'Pilar de Anuu', domain: 'Niebla & Paradoja', bonus: 'Re-roll de 1 dado por encuentro', mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 4, void_affinity_delta: 18 } }
  ]);

  const EMBEDDED_FACTIONS = Object.freeze([
    {
      id: 'F01',
      block_key: 'BAJOS_FONDOS',
      block: 'Bajos Fondos (Callejeros & Supervivencia)',
      name: 'Chatarreros del Alma',
      origin: 'Compendio + JSON',
      status: 'CANÓNICA',
      leader: 'V-Byte',
      philosophy: 'Reciclar lo muerto para sobrevivir. Todo tiene un precio en voltios.',
      tactical_bonus: '+2 a /craft con materiales encontrados, descuento en reparaciones',
      hostility_penalty: 'Sabotaje de equipamiento; robos de ítems menores durante descanso',
      mods: { atk: 1, ac: 0, hp_max_delta: 4, san_max_delta: 0, void_affinity_delta: 2 },
      resonant_archetypes: ['Chatarrero Reciclador', 'Ingeniero de la Forja', 'Guerrero de Cromo'],
      resonant_pillars: ['Pilar de Anubis', 'Pilar de Thoth']
    },
    {
      id: 'F02',
      block_key: 'BAJOS_FONDOS',
      block: 'Bajos Fondos (Callejeros & Supervivencia)',
      name: 'Crew del Rap Licorizado',
      origin: 'JSON (antes Rastro de Cromo en Compendio)',
      status: 'FUSIONADA',
      leader: 'MC-Glitch',
      philosophy: 'La frecuencia es el arma. Los versos cortan más que el cromo.',
      tactical_bonus: '+2 a tiradas de Carisma y moral del escuadrón; Tokens de Sync por duelo de rimas',
      hostility_penalty: 'Humillación pública que reduce Lealtad de reclutas en -10',
      mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 4, void_affinity_delta: 4 },
      resonant_archetypes: ['Hacker de Resonancia', 'Asesino de Frecuencia', 'Invocador del Panteón'],
      resonant_pillars: ['Pilar de Hathor', 'Pilar de Set']
    },
    {
      id: 'F03',
      block_key: 'BAJOS_FONDOS',
      block: 'Bajos Fondos (Callejeros & Supervivencia)',
      name: 'Sindicato de la Bruma / Neon-Siren',
      origin: 'JSON (Sindicato de la Bruma) + Compendio (Sindicato Neon-Siren)',
      status: 'FUSIONADA',
      leader: 'Nyx-Siren',
      philosophy: 'El contrabando es libertad. La niebla protege a quien paga.',
      tactical_bonus: 'Acceso a mercado negro de ítems raros; información anticipada de emboscadas',
      hostility_penalty: 'Emboscadas con veneno de datos; precios inflados x3 en comercio',
      mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 0, void_affinity_delta: 10 },
      resonant_archetypes: ['Asesino de Frecuencia', 'Hacker de Resonancia', 'Tejedor del Vacío'],
      resonant_pillars: ['Pilar de Bastet', 'Pilar de Anuu']
    },
    {
      id: 'F04',
      block_key: 'BAJOS_FONDOS',
      block: 'Bajos Fondos (Callejeros & Supervivencia)',
      name: 'Mercaderes del Vacío',
      origin: 'JSON (Cultistas del Vacío en Compendio)',
      status: 'FUSIONADA',
      leader: 'Hollow-Ark',
      philosophy: 'El Vacío no destruye, transforma. Todo regresa como deuda.',
      tactical_bonus: 'Compra de Soul Echoes y Bloodeaters a mitad de coste de SAN',
      hostility_penalty: 'Maldiciones de Vacío: -5% SAN pasivo por sesión de trauma',
      mods: { atk: 2, ac: 0, hp_max_delta: -4, san_max_delta: -4, void_affinity_delta: 20 },
      resonant_archetypes: ['Tejedor del Vacío', 'Berserker Bloodeater', 'Invocador del Panteón'],
      resonant_pillars: ['Pilar de Anuu', 'Pilar de Anubis', 'Pilar de Set']
    },
    {
      id: 'F05',
      block_key: 'CORPORACIONES_Y_ORDEN',
      block: 'Corporaciones & Orden (Poder Institucional)',
      name: 'Sentinel Corp / Búnkers de Centuriones',
      origin: 'JSON (Sentinel Corp) + Compendio (Búnkers de Centuriones)',
      status: 'FUSIONADA',
      leader: 'Centurion-Prime',
      philosophy: 'El orden absoluto es la única barrera contra la entropía.',
      tactical_bonus: '+2 a CA del escuadrón en zonas controladas; acceso a armería pesada',
      hostility_penalty: 'Cacería activa; bounty hunters enviados cada 3 sesiones',
      mods: { atk: 0, ac: 2, hp_max_delta: 6, san_max_delta: 0, void_affinity_delta: -6 },
      resonant_archetypes: ['Centinela Djed', 'Guerrero de Cromo', 'Ingeniero de la Forja'],
      resonant_pillars: ['Pilar de Horus', 'Pilar de Sekhmet']
    },
    {
      id: 'F06',
      block_key: 'CORPORACIONES_Y_ORDEN',
      block: 'Corporaciones & Orden (Poder Institucional)',
      name: 'Vanguardia Djed',
      origin: 'Compendio',
      status: 'CANÓNICA',
      leader: 'Djed-Anubis',
      philosophy: 'El pilar Djed sostiene el cielo. La estabilidad es sagrada.',
      tactical_bonus: '+2 a tiradas de resistencia y estabilización; curación pasiva +3 HP/descanso',
      hostility_penalty: 'Excomunión: pérdida de acceso a zonas seguras y santuarios de curación',
      mods: { atk: 0, ac: 1, hp_max_delta: 8, san_max_delta: 4, void_affinity_delta: -4 },
      resonant_archetypes: ['Centinela Djed', 'Médico de Almas', 'Guerrero de Cromo'],
      resonant_pillars: ['Pilar de Isis', 'Pilar de Osiris']
    },
    {
      id: 'F07',
      block_key: 'CORPORACIONES_Y_ORDEN',
      block: 'Corporaciones & Orden (Poder Institucional)',
      name: 'Autómatas Maat',
      origin: 'Compendio',
      status: 'CANÓNICA',
      leader: 'Justicia-Binaria',
      philosophy: 'La Balanza no miente. Toda acción tiene su peso exacto.',
      tactical_bonus: 'Juicio de Maat: resolución justa de disputas; bonus a Karma y /favor',
      hostility_penalty: 'Veredicto de culpabilidad: penalizador -3 a todas las tiradas sociales',
      mods: { atk: 1, ac: 1, hp_max_delta: 2, san_max_delta: 4, void_affinity_delta: -5 },
      resonant_archetypes: ['Centinela Djed', 'Exorcista de Bitrate', 'Oráculo Goético'],
      resonant_pillars: ['Pilar de Maat', 'Pilar de Horus']
    },
    {
      id: 'F08',
      block_key: 'CORPORACIONES_Y_ORDEN',
      block: 'Corporaciones & Orden (Poder Institucional)',
      name: 'Hijos de la Forja',
      origin: 'JSON',
      status: 'CANÓNICA',
      leader: 'Vulcan-Set',
      philosophy: 'Del fuego nace lo irrompible. Solo el metal probado merece existir.',
      tactical_bonus: 'Mejora de Bloodeaters +1 tier; reparación de ítems legendarios',
      hostility_penalty: 'Destrucción de un ítem equipado al azar',
      mods: { atk: 2, ac: 0, hp_max_delta: 4, san_max_delta: 0, void_affinity_delta: 4 },
      resonant_archetypes: ['Ingeniero de la Forja', 'Berserker Bloodeater', 'Guerrero de Cromo'],
      resonant_pillars: ['Pilar de Ra', 'Pilar de Sekhmet', 'Pilar de Set']
    },
    {
      id: 'F09',
      block_key: 'CULTOS_DEL_PANTEON',
      block: 'Cultos del Panteón (Misticismo & Frecuencia)',
      name: 'Exorcistas de Bitrate',
      origin: 'Compendio + JSON',
      status: 'CANÓNICA',
      leader: 'Hz-Prophet',
      philosophy: 'Purgar la corrupción de datos es purgar el alma.',
      tactical_bonus: '+3 a tiradas contra entidades del Vacío; limpieza de estados negativos',
      hostility_penalty: 'Purga forzada: eliminación de un buff activo del jugador',
      mods: { atk: 2, ac: 0, hp_max_delta: 0, san_max_delta: 6, void_affinity_delta: 6 },
      resonant_archetypes: ['Exorcista de Bitrate', 'Médico de Almas', 'Centinela Djed'],
      resonant_pillars: ['Pilar de Isis', 'Pilar de Ra', 'Pilar de Maat']
    },
    {
      id: 'F10',
      block_key: 'CULTOS_DEL_PANTEON',
      block: 'Cultos del Panteón (Misticismo & Frecuencia)',
      name: 'Punks Goéticos',
      origin: 'Compendio + JSON',
      status: 'CANÓNICA',
      leader: 'Daemon-Riot',
      philosophy: 'Los demonios son herramientas. La rebelión es la única oración.',
      tactical_bonus: 'Invocación de entidades menores como escudos temporales; +2 a /soul',
      hostility_penalty: 'Posesión parcial de un recluta: pierde 1 turno por encuentro',
      mods: { atk: 2, ac: 0, hp_max_delta: 0, san_max_delta: -2, void_affinity_delta: 15 },
      resonant_archetypes: ['Invocador del Panteón', 'Oráculo Goético', 'Berserker Bloodeater'],
      resonant_pillars: ['Pilar de Set', 'Pilar de Sekhmet']
    },
    {
      id: 'F11',
      block_key: 'CULTOS_DEL_PANTEON',
      block: 'Cultos del Panteón (Misticismo & Frecuencia)',
      name: 'Alquimistas de 189Hz',
      origin: 'Compendio',
      status: 'CANÓNICA',
      leader: 'Resonance-Thoth',
      philosophy: 'La frecuencia sagrada transmuta la materia y el espíritu.',
      tactical_bonus: 'Sintonización de Bloodeaters sin coste de SAN; crafting alquímico avanzado',
      hostility_penalty: 'Desafinación: -2 a todas las tiradas de Resonancia Prima',
      mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 6, void_affinity_delta: 12 },
      resonant_archetypes: ['Oráculo Goético', 'Tejedor del Vacío', 'Ingeniero de la Forja', 'Médico de Almas'],
      resonant_pillars: ['Pilar de Thoth', 'Pilar de Hathor', 'Pilar de Osiris']
    },
    {
      id: 'F12',
      block_key: 'CULTOS_DEL_PANTEON',
      block: 'Cultos del Panteón (Misticismo & Frecuencia)',
      name: 'Analistas de Shau / Anomalías de K4L1',
      origin: 'JSON (ambas)',
      status: 'FUSIONADA',
      leader: 'K4L1-Echo / Shau-Lens',
      philosophy: 'Observar sin intervenir es el poder supremo. Los datos son la verdad desnuda.',
      tactical_bonus: 'Escaneo completo de enemigos (/whois gratis); predicción de Lair Actions',
      hostility_penalty: 'Ocultación de información crítica; mapas y escaneos devuelven datos falsos',
      mods: { atk: 1, ac: 1, hp_max_delta: 0, san_max_delta: 4, void_affinity_delta: 16 },
      resonant_archetypes: ['Oráculo Goético', 'Hacker de Resonancia', 'Tejedor del Vacío'],
      resonant_pillars: ['Pilar de Horus', 'Pilar de Anuu', 'Pilar de Thoth']
    }
  ]);

  function buildEmbeddedCodexFallback() {
    const classes144 = [];
    let cid = 1;
    for (let a = 0; a < EMBEDDED_ARCHETYPES.length; a++) {
      const arch = EMBEDDED_ARCHETYPES[a];
      for (let p = 0; p < EMBEDDED_PILLARS.length; p++) {
        const pil = EMBEDDED_PILLARS[p];
        const code = `C${String(cid).padStart(3, '0')}`;
        const voidAff = Math.max(5, Math.min(99, arch.mods.base_void_affinity + pil.mods.void_affinity_delta));
        classes144.push({
          class_id: cid,
          code: code,
          class_name: `${arch.name} del ${pil.deity}`,
          archetype: arch.name,
          archetype_role: arch.role,
          triad: arch.triad,
          pillar: pil.pillar,
          deity: pil.deity,
          pillar_domain: pil.domain,
          base_stat: arch.stat,
          archetype_passive: arch.passive,
          pillar_bonus: pil.bonus,
          mods: {
            atk: arch.mods.atk + pil.mods.atk,
            ac: arch.mods.ac + pil.mods.ac,
            hp_max_delta: arch.mods.hp_max_delta + pil.mods.hp_max_delta,
            san_max_delta: arch.mods.san_max_delta + pil.mods.san_max_delta,
            bloodeater_cost_reduction: arch.mods.bloodeater_cost_reduction,
            void_affinity: voidAff
          }
        });
        cid += 1;
      }
    }
    return {
      source: 'EMBEDDED_FALLBACK',
      classes144,
      factions: EMBEDDED_FACTIONS.slice()
    };
  }

  function normalizeSearchText(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function synthesizeSeinenClassDossier(cls, fac, hasSynergy, voidPct) {
    if (!cls || !fac) return '';
    const voidTone =
      voidPct >= 75
        ? 'Su corteza neural late al borde de la singularidad abisal; la niebla de 619 Hz obedece sus vectores antes de que la sangre toque el suelo.'
        : voidPct >= 48
          ? 'Camina en equilibrio quirúrgico entre el cromo oxidado y las frecuencias prohibidas del Vacío.'
          : 'Rechaza el canto del abismo confiando en acero templado, disciplina táctica y blindaje físico.';
    const synergyNote = hasSynergy
      ? ` Resonancia canónica plena con «${fac.name}» bajo el mando de ${fac.leader} (+1 ATK táctico y +5% sintonía de Vacío).`
      : ` Opera en pacto instrumental con «${fac.name}» (${fac.leader}), vigilando cada cláusula de deuda en la penumbra del Año 10.`;
    return (
      `Forjada como ${cls.class_name} [${cls.code} · ${cls.base_stat}], canaliza el dominio «${cls.pillar_domain}» del ${cls.pillar}. ` +
      `${voidTone}${synergyNote}`
    );
  }

  // ===========================================================================
  // 5C. SIMULADOR MONTE CARLO HÍBRIDO 500,000x 2d20
  //     (ARM64 Edge :18989 Go Worker + Fallback Local Criptográfico 100,000x)
  // ===========================================================================

  const PRIME_BITMASK =
    (1 << 2) | (1 << 3) | (1 << 5) | (1 << 7) | (1 << 11) | (1 << 13) | (1 << 17) | (1 << 19);

  /**
   * Simulación local pura de 100,000 tiradas 2d20 Resonancia Prima sin bloqueo de UI.
   * Paridad matemática exacta con el worker Go ARM64 (:18989/compute/omega-sim).
   * @param {number} difficulty
   * @param {number} bonus
   */
  function runLocalMonteCarlo100k(difficulty, bonus) {
    const trials = 100000;
    const t0 = performance.now();

    let doublePrimeOmega = 0;
    let primeResonanceHits = 0;
    let standardSuccess = 0;
    let faultCollapses = 0;
    let doubleOneCataclysm = 0;

    const hasCrypto = Boolean(window.crypto && window.crypto.getRandomValues);
    const chunk = hasCrypto ? new Uint8Array(65536) : null;
    let cursor = chunk ? chunk.length : 0;

    const nextD20 = () => {
      if (chunk) {
        while (true) {
          if (cursor >= chunk.length) {
            window.crypto.getRandomValues(chunk);
            cursor = 0;
          }
          const b = chunk[cursor++];
          if (b < 240) return (b % 20) + 1;
        }
      }
      return ((Math.random() * 20) | 0) + 1;
    };

    for (let i = 0; i < trials; i++) {
      const d1 = nextD20();
      const d2 = nextD20();

      if (d1 === 1 && d2 === 1) {
        doubleOneCataclysm += 1;
        faultCollapses += 1;
        continue;
      }

      const p1 = (PRIME_BITMASK & (1 << d1)) !== 0;
      const p2 = (PRIME_BITMASK & (1 << d2)) !== 0;

      if (p1 && p2) {
        doublePrimeOmega += 1;
      } else if (p1 || p2) {
        if (d1 + d2 + bonus + 3 >= difficulty) {
          primeResonanceHits += 1;
        } else {
          faultCollapses += 1;
        }
      } else if (d1 + d2 + bonus >= difficulty) {
        standardSuccess += 1;
      } else {
        faultCollapses += 1;
      }
    }

    const elapsedMs = Number((performance.now() - t0).toFixed(2));
    const totalSuccess = doublePrimeOmega + primeResonanceHits + standardSuccess;
    const successRatePct = Number(((totalSuccess / trials) * 100).toFixed(2));
    const omegaRatePct = Number(((doublePrimeOmega / trials) * 100).toFixed(2));

    const verdict =
      successRatePct >= 75
        ? '[Kilonova 🌟]: Armonía Doble Primo a 189.89.619 Hz. Horizonte Omega despejado.'
        : successRatePct >= 45
          ? '[Kanuv 🛡️]: Margen táctico tenso; activa Sinergia de Tríada o vínculo Bloodeater.'
          : '[Set ⚡]: Probabilidad hostil; solo la Resonancia Prima quebrará este blindaje.';

    return {
      node: 'Browser Local Engine',
      cores_used: 1,
      is_edge_arm64: false,
      trials: trials,
      difficulty: difficulty,
      bonus: bonus,
      elapsed_ms: elapsedMs,
      double_prime_omega: doublePrimeOmega,
      prime_resonance_hits: primeResonanceHits,
      standard_success: standardSuccess,
      fault_collapses: faultCollapses,
      double_one_cataclysm: doubleOneCataclysm,
      success_rate_pct: successRatePct,
      omega_rate_pct: omegaRatePct,
      oracle_verdict: verdict
    };
  }

  /**
   * Intenta primero POST http://127.0.0.1:18989/compute/omega-sim (500,000x en Go ARM64, timeout 2000ms)
   * y degrada limpiamente a 100,000x en Browser Local Engine.
   * @param {number} difficulty
   * @param {number} bonus
   */
  async function executeHybridMonteCarlo(difficulty, bonus) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    try {
      const res = await fetch('http://127.0.0.1:18989/compute/omega-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trials: 500000,
          difficulty: difficulty,
          bonus: bonus
        }),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.trials === 'number' && data.trials > 0) {
          return Object.assign({ is_edge_arm64: true }, data);
        }
      }
    } catch (_err) {
      clearTimeout(timer);
    }

    // Ceder 1 frame para mantener la UI fluida a 60 FPS antes del cómputo local 100k
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return runLocalMonteCarlo100k(difficulty, bonus);
  }

  // ===========================================================================
  // 6. CONTROLADOR DE INTERFAZ Y API PÚBLICA window.AnusetOmegaHost
  // ===========================================================================

  const diceEngine = new ArgonDiceEngine();
  const agent = new ArgonCharacter('K4L1 // ARQUITECTA', 'FISICO');
  const oracle = new ArgonOracleBridge();
  /** @type {TheVoidCanvasRenderer | null} */
  let voidRenderer = null;

  const initialFallbackCodex = buildEmbeddedCodexFallback();
  const codexState = {
    source: initialFallbackCodex.source,
    classes144: initialFallbackCodex.classes144,
    factions: initialFallbackCodex.factions,
    activeClass: initialFallbackCodex.classes144[0],
    activeFaction: initialFallbackCodex.factions[7] || initialFallbackCodex.factions[0], // F08 Hijos de la Forja
    activeLore: '',
    filterTriad: 'ALL',
    filterAffinity: 'ALL',
    searchQuery: ''
  };

  // Vincular build canónico inicial al Agente del calibrador
  agent.applyCodexBuild(codexState.activeClass, codexState.activeFaction);
  codexState.activeLore = synthesizeSeinenClassDossier(
    codexState.activeClass,
    codexState.activeFaction,
    agent.hasFactionClassSynergy,
    agent.voidAffinityPct
  );

  const hostState = {
    mode: 'STAGING_CALIBRATOR', // 'STAGING_CALIBRATOR' | 'ENGINE_MOUNTED'
    mountedConfig: null,
    wsConnection: null,
    wasmInstance: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function appendOracleLog(tag, message, tone = 'cyan') {
    const logBox = el('omega-oracle-log');
    if (!logBox) return;

    const palette = {
      cyan: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20',
      gold: 'text-amber-300 border-amber-400/40 bg-amber-950/25',
      crimson: 'text-rose-300 border-rose-500/40 bg-rose-950/30',
      purple: 'text-purple-200 border-purple-500/30 bg-purple-950/20'
    };

    const entry = document.createElement('div');
    entry.className = `px-2.5 py-1.5 rounded-lg border text-xs leading-relaxed ${palette[tone] || palette.cyan}`;

    const stamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
    const headerSpan = document.createElement('span');
    headerSpan.className = 'font-mono-tactical text-[10px] uppercase tracking-wider opacity-80 mr-2';
    headerSpan.textContent = `[${stamp} · ${tag}]`;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    entry.appendChild(headerSpan);
    entry.appendChild(textSpan);

    logBox.prepend(entry);
    while (logBox.children.length > 18) {
      logBox.removeChild(logBox.lastChild);
    }
  }

  function syncHud() {
    const sanPct = Math.round(agent.sanityPercentage());
    const hpPct = agent.hpMax > 0 ? Math.round((agent.hp / agent.hpMax) * 100) : 0;
    const psychosis = agent.isPsychosisActive();
    const hardFault = diceEngine.isHardFault();

    // Sincronizar modo Psicosis en el contenedor 16:9 y en TheVoid
    const stageShell = el('omega-viewport-mount');
    if (stageShell) {
      stageShell.setAttribute('data-psychosis', psychosis ? 'active' : 'nominal');
    }
    if (voidRenderer) {
      voidRenderer.psychosisMode = psychosis;
      voidRenderer.hardFaultMode = hardFault;
    }

    // Barras y textos biométricos
    const hpText = el('hud-hp-text');
    const hpBar = el('hud-hp-bar');
    if (hpText) hpText.textContent = `${agent.hp} / ${agent.hpMax}`;
    if (hpBar) hpBar.style.width = `${hpPct}%`;

    const sanText = el('hud-san-text');
    const sanBar = el('hud-san-bar');
    const sanSlider = el('hud-san-slider');
    if (sanText) {
      sanText.textContent = `${sanPct}% (${agent.san}/${agent.sanMax})`;
      sanText.className = psychosis
        ? 'font-mono-tactical text-xs font-bold text-rose-400 animate-pulse'
        : 'font-mono-tactical text-xs font-bold text-cyan-300';
    }
    if (sanBar) {
      sanBar.style.width = `${sanPct}%`;
      sanBar.style.background = psychosis
        ? 'linear-gradient(90deg, #ff1e56, #fb7185)'
        : 'linear-gradient(90deg, #8A2BE2, #00f5d4)';
    }
    if (sanSlider) {
      sanSlider.max = String(agent.sanMax);
      if (Number(sanSlider.value) !== agent.san) {
        sanSlider.value = String(agent.san);
      }
    }

    const roleSelect = el('hud-role-select');
    if (roleSelect && roleSelect.value !== agent.role.id) {
      roleSelect.value = agent.role.id;
    }

    // Vínculo en vivo de Clase 144 & Facción en el HUD superior
    const clsLabel = el('hud-active-class-label');
    if (clsLabel && agent.activeClass) {
      clsLabel.textContent = `[${agent.activeClass.code}] ${agent.activeClass.class_name}`;
    }
    const facLabel = el('hud-active-faction-label');
    if (facLabel && agent.activeFaction) {
      facLabel.textContent = `${agent.activeFaction.id} ${agent.activeFaction.name}`;
    }
    const voidVal = el('hud-void-affinity-val');
    if (voidVal) {
      voidVal.textContent = `${agent.voidAffinityPct}%`;
    }

    // Estado Psicosis & Bendición de Kilonova
    const psychBadge = el('hud-psychosis-badge');
    if (psychBadge) {
      if (psychosis) {
        psychBadge.textContent = '⚠️ PSICOSIS ACTIVA (<15% SAN · GLITCH 619Hz)';
        psychBadge.className =
          'px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse';
      } else if (agent.bloodeater && agent.bloodeater.immunePsychosis && sanPct < 15) {
        psychBadge.textContent = '🛡️ INMUNE A PSICOSIS (AMULETO PANTEÓN)';
        psychBadge.className =
          'px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40';
      } else {
        psychBadge.textContent = 'ESTABILIDAD COGNITIVA NOMINAL';
        psychBadge.className =
          'px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-emerald-500/10 text-emerald-300 border border-emerald-500/30';
      }
    }

    const kiloBadge = el('hud-kilonova-badge');
    if (kiloBadge) {
      if (agent.kilonovaBlessingReady) {
        kiloBadge.textContent = '𓆣 KILONOVA: LISTA (1 RESCATE)';
        kiloBadge.className =
          'px-2 py-0.5 rounded text-[10px] font-mono-tactical font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40';
      } else {
        kiloBadge.textContent = '𓆣 KILONOVA: GASTADA';
        kiloBadge.className =
          'px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-zinc-800/80 text-zinc-400 border border-zinc-700';
      }
    }

    // Estadísticas derivadas
    const modSpan = el('hud-total-mod');
    if (modSpan) {
      const m = agent.totalTacticalModifier();
      modSpan.textContent = m >= 0 ? `+${m}` : `${m}`;
    }

    const acSpan = el('hud-ac-val');
    if (acSpan) acSpan.textContent = `AC ${agent.armorClass} · Crit ${agent.critThreshold}+`;

    const faultSpan = el('hud-fault-counter');
    if (faultSpan) {
      const f = diceEngine.accumulatedFumbles();
      faultSpan.textContent = `PIFIAS ACUMULADAS: ${f}/3`;
      faultSpan.className =
        f >= 3
          ? 'font-mono-tactical text-[10px] font-bold text-rose-400 animate-pulse'
          : f > 0
            ? 'font-mono-tactical text-[10px] font-semibold text-amber-300'
            : 'font-mono-tactical text-[10px] text-zinc-400';
    }

    const beDesc = el('hud-bloodeater-desc');
    if (beDesc) {
      if (agent.bloodeater) {
        const discountNote =
          agent.bloodeaterCostReduction > 0
            ? ` [Temple Clase: -${agent.bloodeaterCostReduction} coste HP_Max]`
            : '';
        beDesc.textContent = `${agent.bloodeater.description}${discountNote}`;
      } else {
        beDesc.textContent = `Sin sacrificio Bloodeater activo (HP_Max íntegro ${agent.hpMax}/${agent.hpMax}).`;
      }
    }

    renderCodexDossier();
  }

  // ===========================================================================
  // 6B. RENDERIZADOR UI DEL CÓDICE 144 & SIMULADOR MONTE CARLO HÍBRIDO
  // ===========================================================================

  function checkClassFactionSynergy(cls, fac) {
    if (!cls || !fac) return false;
    const resArch = Array.isArray(fac.resonant_archetypes) ? fac.resonant_archetypes : [];
    const resPil = Array.isArray(fac.resonant_pillars) ? fac.resonant_pillars : [];
    return resArch.includes(cls.archetype) || resPil.includes(cls.pillar);
  }

  function renderCodexDossier() {
    const cls = codexState.activeClass;
    const fac = codexState.activeFaction;
    if (!cls || !fac) return;

    codexState.activeLore = synthesizeSeinenClassDossier(
      cls,
      fac,
      agent.hasFactionClassSynergy,
      agent.voidAffinityPct
    );

    const codeEl = el('dossier-class-code');
    if (codeEl) codeEl.textContent = cls.code;

    const triadBadge = el('dossier-triad-badge');
    if (triadBadge) triadBadge.textContent = agent.role.label;

    const statBadge = el('dossier-stat-badge');
    if (statBadge) statBadge.textContent = `STAT: ${cls.base_stat}`;

    const synBadge = el('dossier-synergy-badge');
    if (synBadge) {
      if (agent.hasFactionClassSynergy) {
        synBadge.classList.remove('hidden');
      } else {
        synBadge.classList.add('hidden');
      }
    }

    const nameEl = el('dossier-class-name');
    if (nameEl) nameEl.textContent = cls.class_name;

    const pillarLine = el('dossier-pillar-line');
    if (pillarLine) {
      pillarLine.textContent = `${cls.archetype} (${cls.archetype_role}) · ${cls.pillar} — ${cls.pillar_domain}`;
    }

    const facHeader = el('dossier-faction-header');
    if (facHeader) facHeader.textContent = `☥ [${fac.id}] ${fac.name}`;

    const facStatus = el('dossier-faction-status');
    if (facStatus) facStatus.textContent = fac.status;

    const facMeta = el('dossier-faction-meta');
    if (facMeta) facMeta.textContent = `${fac.block} · Líder: ${fac.leader}`;

    const facPhil = el('dossier-faction-philosophy');
    if (facPhil) facPhil.textContent = `«${fac.philosophy}»`;

    const voidPctEl = el('dossier-void-pct');
    if (voidPctEl) voidPctEl.textContent = `${agent.voidAffinityPct}%`;

    const voidBarEl = el('dossier-void-bar');
    if (voidBarEl) voidBarEl.style.width = `${agent.voidAffinityPct}%`;

    const modAtkEl = el('dossier-mod-atk');
    if (modAtkEl) {
      const m = agent.totalTacticalModifier();
      modAtkEl.textContent = `${m >= 0 ? '+' : ''}${m} · Crit ${agent.critThreshold}+`;
    }

    const modAcEl = el('dossier-mod-ac');
    if (modAcEl) {
      modAcEl.textContent = `AC ${agent.armorClass} · RD ${agent.damageReduction}`;
    }

    const modVitalEl = el('dossier-mod-vital');
    if (modVitalEl) {
      modVitalEl.textContent = `HP ${agent.hpMax} · SAN ${agent.sanMax}`;
    }

    const modBeEl = el('dossier-mod-be');
    if (modBeEl) {
      modBeEl.textContent =
        agent.bloodeaterCostReduction > 0
          ? `-${agent.bloodeaterCostReduction} coste HP_Max`
          : 'Coste Estándar';
    }

    const pArch = el('dossier-passive-arch');
    if (pArch) pArch.textContent = cls.archetype_passive;

    const pPil = el('dossier-passive-pillar');
    if (pPil) pPil.textContent = cls.pillar_bonus;

    const fBonus = el('dossier-faction-bonus');
    if (fBonus) fBonus.textContent = fac.tactical_bonus;

    const fPen = el('dossier-faction-penalty');
    if (fPen) fPen.textContent = fac.hostility_penalty;

    const loreEl = el('dossier-seinen-lore');
    if (loreEl) loreEl.textContent = codexState.activeLore;
  }

  function getFilteredCodexClasses() {
    const q = normalizeSearchText(codexState.searchQuery.trim());
    const triad = codexState.filterTriad;
    const aff = codexState.filterAffinity;
    const activeFac = codexState.activeFaction;

    return codexState.classes144.filter((cls) => {
      if (triad !== 'ALL' && cls.triad !== triad) return false;

      if (aff === 'SYNERGY_ACTIVE') {
        if (!checkClassFactionSynergy(cls, activeFac)) return false;
      } else if (aff.startsWith('FACTION:')) {
        const fid = aff.slice(8);
        const fObj = codexState.factions.find((f) => f.id === fid);
        if (fObj && !checkClassFactionSynergy(cls, fObj)) return false;
      } else if (aff.startsWith('PILLAR:')) {
        const pilName = aff.slice(7);
        if (cls.pillar !== pilName) return false;
      } else if (aff.startsWith('ARCH:')) {
        const archName = aff.slice(5);
        if (cls.archetype !== archName) return false;
      }

      if (q) {
        const haystack = normalizeSearchText(
          `${cls.code} ${cls.class_id} ${cls.class_name} ${cls.archetype} ${cls.archetype_role} ${cls.pillar} ${cls.pillar_domain} ${cls.base_stat} ${cls.archetype_passive} ${cls.pillar_bonus}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCodexClassGrid() {
    const grid = el('codex-class-grid');
    const countBadge = el('codex-count-badge');
    if (!grid) return;

    const filtered = getFilteredCodexClasses();
    if (countBadge) {
      countBadge.textContent = `${filtered.length} / ${codexState.classes144.length} CLASES`;
    }

    grid.textContent = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className =
        'col-span-full bg-black/50 border border-purple-500/25 rounded-xl p-4 text-center text-xs font-mono-tactical text-zinc-400';
      empty.textContent = 'Sin coincidencias en la Matriz 144 para los filtros activos. Pulsa ↺ para restablecer.';
      grid.appendChild(empty);
      return;
    }

    const triadColorMap = {
      FISICO: 'text-emerald-300 border-emerald-500/35 bg-emerald-500/10',
      MAGIA: 'text-purple-200 border-purple-400/40 bg-purple-500/15',
      DEFENSA: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/10',
      HIBRIDO: 'text-amber-300 border-amber-400/40 bg-amber-500/10'
    };

    const frag = document.createDocumentFragment();
    const activeId = codexState.activeClass ? codexState.activeClass.class_id : -1;

    for (let i = 0; i < filtered.length; i++) {
      const cls = filtered[i];
      const isSelected = cls.class_id === activeId;
      const isSynergy = checkClassFactionSynergy(cls, codexState.activeFaction);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `codex-class-card${isSelected ? ' is-selected' : ''}${isSynergy ? ' has-synergy' : ''}`;
      card.setAttribute('data-class-id', String(cls.class_id));

      const topRow = document.createElement('div');
      topRow.className = 'flex items-center justify-between gap-1.5 font-mono-tactical text-[10px] mb-1';

      const leftBadges = document.createElement('div');
      leftBadges.className = 'flex items-center gap-1';

      const codeSpan = document.createElement('span');
      codeSpan.className = 'font-bold text-cyan-300';
      codeSpan.textContent = `[${cls.code}]`;

      const triadSpan = document.createElement('span');
      triadSpan.className = `px-1.5 py-0.2 rounded border text-[9px] font-bold ${triadColorMap[cls.triad] || triadColorMap.FISICO}`;
      triadSpan.textContent = cls.triad;

      leftBadges.appendChild(codeSpan);
      leftBadges.appendChild(triadSpan);

      const rightMeta = document.createElement('div');
      rightMeta.className = 'flex items-center gap-1';

      if (isSynergy) {
        const synTag = document.createElement('span');
        synTag.className = 'text-[9px] font-bold text-amber-300';
        synTag.textContent = '★ AFÍN';
        rightMeta.appendChild(synTag);
      }

      const statSpan = document.createElement('span');
      statSpan.className = 'text-[9px] text-zinc-400';
      statSpan.textContent = cls.base_stat;
      rightMeta.appendChild(statSpan);

      topRow.appendChild(leftBadges);
      topRow.appendChild(rightMeta);

      const titleDiv = document.createElement('div');
      titleDiv.className = 'text-xs font-extrabold text-white leading-snug truncate';
      titleDiv.textContent = cls.class_name;

      const subDiv = document.createElement('div');
      subDiv.className = 'text-[10px] font-mono-tactical text-zinc-400 truncate mt-0.5';
      subDiv.textContent = `${cls.pillar_domain} · ${cls.pillar_bonus}`;

      card.appendChild(topRow);
      card.appendChild(titleDiv);
      card.appendChild(subDiv);

      card.addEventListener('click', () => {
        selectCodexBuild(cls.class_id, null, true);
      });

      frag.appendChild(card);
    }

    grid.appendChild(frag);
  }

  function populateCodexDropdowns() {
    const facSelect = el('codex-faction-select');
    if (facSelect) {
      facSelect.textContent = '';
      const blocksMap = new Map();
      codexState.factions.forEach((f) => {
        if (!blocksMap.has(f.block)) blocksMap.set(f.block, []);
        blocksMap.get(f.block).push(f);
      });

      blocksMap.forEach((fList, blockTitle) => {
        const grp = document.createElement('optgroup');
        grp.label = blockTitle;
        fList.forEach((f) => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = `[${f.id}] ${f.name} (${f.leader})`;
          if (codexState.activeFaction && codexState.activeFaction.id === f.id) {
            opt.selected = true;
          }
          grp.appendChild(opt);
        });
        facSelect.appendChild(grp);
      });
    }

    const affSelect = el('codex-affinity-filter');
    if (affSelect) {
      const currentVal = codexState.filterAffinity || 'ALL';
      affSelect.textContent = '';

      const optAll = document.createElement('option');
      optAll.value = 'ALL';
      optAll.textContent = 'Todas las Clases Modulares (144)';
      affSelect.appendChild(optAll);

      const optSyn = document.createElement('option');
      optSyn.value = 'SYNERGY_ACTIVE';
      optSyn.textContent = '★ Solo Afines a la Facción Activa';
      affSelect.appendChild(optSyn);

      const grpFac = document.createElement('optgroup');
      grpFac.label = 'Filtrar por Facción Canónica (12)';
      codexState.factions.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = `FACTION:${f.id}`;
        opt.textContent = `☥ [${f.id}] Afines a ${f.name}`;
        grpFac.appendChild(opt);
      });
      affSelect.appendChild(grpFac);

      const grpPil = document.createElement('optgroup');
      grpPil.label = 'Filtrar por Pilar Divino (12)';
      const uniquePillars = [];
      codexState.classes144.forEach((c) => {
        if (!uniquePillars.includes(c.pillar)) uniquePillars.push(c.pillar);
      });
      uniquePillars.forEach((pName) => {
        const opt = document.createElement('option');
        opt.value = `PILLAR:${pName}`;
        opt.textContent = `𓊽 ${pName}`;
        grpPil.appendChild(opt);
      });
      affSelect.appendChild(grpPil);

      const grpArch = document.createElement('optgroup');
      grpArch.label = 'Filtrar por Arquetipo (12)';
      const uniqueArchs = [];
      codexState.classes144.forEach((c) => {
        if (!uniqueArchs.includes(c.archetype)) uniqueArchs.push(c.archetype);
      });
      uniqueArchs.forEach((aName) => {
        const opt = document.createElement('option');
        opt.value = `ARCH:${aName}`;
        opt.textContent = `⚔ ${aName}`;
        grpArch.appendChild(opt);
      });
      affSelect.appendChild(grpArch);

      affSelect.value = currentVal;
    }
  }

  function selectCodexBuild(classId, factionId, shouldLog = true) {
    if (classId !== null && classId !== undefined) {
      const foundCls = codexState.classes144.find((c) => c.class_id === Number(classId));
      if (foundCls) codexState.activeClass = foundCls;
    }
    if (factionId !== null && factionId !== undefined) {
      const foundFac = codexState.factions.find((f) => f.id === String(factionId));
      if (foundFac) {
        codexState.activeFaction = foundFac;
        const facSelect = el('codex-faction-select');
        if (facSelect && facSelect.value !== foundFac.id) {
          facSelect.value = foundFac.id;
        }
      }
    }

    agent.applyCodexBuild(codexState.activeClass, codexState.activeFaction);
    syncHud();
    renderCodexClassGrid();

    if (shouldLog && codexState.activeClass && codexState.activeFaction) {
      if (voidRenderer) {
        voidRenderer.triggerPulse(agent.hasFactionClassSynergy ? 'double' : 'omega');
      }
      const mod = agent.totalTacticalModifier();
      const synTag = agent.hasFactionClassSynergy ? ' · ★ SINERGIA FACCIÓN (+1 ATK)' : '';
      appendOracleLog(
        'FORJA 144 🧬',
        `[${codexState.activeClass.code}] ${codexState.activeClass.class_name} vinculado a «${codexState.activeFaction.name}» -> ` +
          `Tríada ${agent.role.label}, Mod ${mod >= 0 ? '+' : ''}${mod}, AC ${agent.armorClass}, Vacío ${agent.voidAffinityPct}%${synTag}.`,
        agent.hasFactionClassSynergy ? 'gold' : 'cyan'
      );
    }

    window.dispatchEvent(
      new CustomEvent('omega:codex-updated', { detail: AnusetOmegaHost.getCanonicalCodex() })
    );
  }

  async function loadCanonicalCodexJson() {
    const loadBadge = el('codex-load-badge');
    try {
      const res = await fetch('codex_144.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.classes) && data.classes.length === 144 && Array.isArray(data.factions)) {
          const prevClassId = codexState.activeClass ? codexState.activeClass.class_id : 1;
          const prevFactionId = codexState.activeFaction ? codexState.activeFaction.id : 'F08';
          codexState.source = 'CODEX_144_JSON';
          codexState.classes144 = data.classes;
          codexState.factions = data.factions;
          populateCodexDropdowns();
          selectCodexBuild(prevClassId, prevFactionId, false);
          if (loadBadge) {
            loadBadge.textContent = 'CÓDICE 144 · JSON ACTIVO';
            loadBadge.className =
              'px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-emerald-500/15 text-emerald-300 border border-emerald-400/40';
          }
          return;
        }
      }
    } catch (_err) {
      // Fallback embebido activo (ej. apertura vía file://)
    }

    if (loadBadge) {
      loadBadge.textContent = 'CÓDICE 144 · EMBEBIDO LOCAL';
      loadBadge.className =
        'px-2 py-0.5 rounded text-[10px] font-mono-tactical bg-purple-500/20 text-purple-200 border border-purple-400/40';
    }
  }

  async function handleMonteCarloExecution() {
    const btn = /** @type {HTMLButtonElement | null} */ (el('btn-monte-carlo-500k'));
    const panel = el('hud-montecarlo-panel');
    const dcSelect = el('hud-target-dc');
    const currentDC = dcSelect ? Number(dcSelect.value) || 16 : 16;
    const currentMod = agent.totalTacticalModifier();

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Ejecutando Simulación Monte Carlo 2d20...';
    }

    try {
      const sim = await executeHybridMonteCarlo(currentDC, currentMod);
      const trials = sim.trials || 1;
      const totalSuccessCount =
        (sim.double_prime_omega || 0) + (sim.prime_resonance_hits || 0) + (sim.standard_success || 0);

      const pctSuccess =
        typeof sim.success_rate_pct === 'number'
          ? sim.success_rate_pct
          : (totalSuccessCount / trials) * 100;
      const pctOmega =
        typeof sim.omega_rate_pct === 'number'
          ? sim.omega_rate_pct
          : ((sim.double_prime_omega || 0) / trials) * 100;
      const pctResonance = ((sim.prime_resonance_hits || 0) / trials) * 100;
      const pctFault = ((sim.fault_collapses || 0) / trials) * 100;
      const pctCataclysm = ((sim.double_one_cataclysm || 0) / trials) * 100;

      if (panel) panel.classList.remove('hidden');
      if (voidRenderer) {
        voidRenderer.resize();
        voidRenderer.triggerPulse(sim.is_edge_arm64 ? 'double' : 'omega');
      }

      const nodeBadge = el('mc-node-badge');
      if (nodeBadge) {
        const coresInfo = sim.cores_used && sim.cores_used > 1 ? ` · ${sim.cores_used} CORES` : '';
        const prefix = sim.is_edge_arm64 ? '🟢' : '🟣';
        nodeBadge.textContent = `${prefix} ${sim.node} (${trials.toLocaleString('es-ES')}x${coresInfo})`;
        nodeBadge.className = sim.is_edge_arm64
          ? 'font-bold text-emerald-300 truncate'
          : 'font-bold text-purple-300 truncate';
      }

      const timeBadge = el('mc-time-badge');
      if (timeBadge) {
        timeBadge.textContent = `${Number(sim.elapsed_ms || 0).toFixed(2)} ms`;
      }

      const setBar = (valId, barId, pct, count, minVisualWidth = 0) => {
        const vEl = el(valId);
        const bEl = el(barId);
        if (vEl) {
          vEl.textContent = `${pct.toFixed(2)}% (${Number(count || 0).toLocaleString('es-ES')})`;
        }
        if (bEl) {
          const widthPct = count > 0 ? Math.min(100, Math.max(minVisualWidth, pct)) : 0;
          bEl.style.width = `${widthPct}%`;
        }
      };

      setBar('mc-val-success', 'mc-bar-success', pctSuccess, totalSuccessCount, 1.5);
      setBar('mc-val-omega', 'mc-bar-omega', pctOmega, sim.double_prime_omega, 1.5);
      setBar('mc-val-resonance', 'mc-bar-resonance', pctResonance, sim.prime_resonance_hits, 1.5);
      setBar('mc-val-fault', 'mc-bar-fault', pctFault, sim.fault_collapses, 1.5);
      setBar('mc-val-cataclysm', 'mc-bar-cataclysm', pctCataclysm, sim.double_one_cataclysm, 1.8);

      const verdictEl = el('mc-verdict-line');
      const modStr = currentMod >= 0 ? `+${currentMod}` : `${currentMod}`;
      if (verdictEl) {
        verdictEl.textContent = `[DC ${currentDC} · Mod ${modStr}] ${sim.oracle_verdict || ''}`;
      }

      appendOracleLog(
        `MONTE CARLO · ${sim.node}`,
        `${trials.toLocaleString('es-ES')}x 2d20 en ${Number(sim.elapsed_ms || 0).toFixed(2)} ms (DC ${currentDC}, Mod ${modStr}) -> ` +
          `Éxito ${pctSuccess.toFixed(2)}% | Doble Primo ${pctOmega.toFixed(2)}% | Resonancia ${pctResonance.toFixed(2)}% | Falla ${pctFault.toFixed(2)}% | Doble-1 ${pctCataclysm.toFixed(2)}%.`,
        sim.is_edge_arm64 ? 'gold' : 'cyan'
      );

      return sim;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Simulación Monte Carlo 500k (ARM64 :18989 / Local)';
      }
    }
  }

  function highlightPrimes(d20A, d20R, isCriticalFumble) {
    const pills = document.querySelectorAll('[data-prime-pill]');
    pills.forEach((pill) => {
      const val = Number(pill.getAttribute('data-prime-pill'));
      pill.classList.remove('active-prime', 'active-double');
      if (isCriticalFumble) return;
      if (val === d20A && val === d20R) {
        pill.classList.add('active-double');
      } else if (val === d20R || val === d20A) {
        pill.classList.add('active-prime');
      }
    });
  }

  async function handleRollExecution(forcedA = null, forcedR = null) {
    if (!agent.isAlive) {
      appendOracleLog('SISTEMA', 'El Agente está fuera de combate (0 HP). Ejecuta Purga en el Horno Alquímico 89.', 'crimson');
      return;
    }

    const dcSelect = el('hud-target-dc');
    const targetDC = dcSelect ? Number(dcSelect.value) || 16 : 16;
    const mod = agent.totalTacticalModifier();

    const result =
      forcedA !== null && forcedR !== null
        ? diceEngine.evaluateRoll(forcedA, forcedR, targetDC, mod)
        : diceEngine.roll(targetDC, mod);

    // Animar orbes 2d20
    const orbA = el('die-orb-action');
    const orbR = el('die-orb-resonance');
    const valA = el('die-val-action');
    const valR = el('die-val-resonance');
    const tagA = el('die-tag-action');
    const tagR = el('die-tag-resonance');

    [orbA, orbR].forEach((orb) => {
      if (!orb) return;
      orb.classList.remove('is-rolling', 'die-prime', 'die-double-prime', 'die-fumble');
      void orb.offsetWidth;
      orb.classList.add('is-rolling');
    });

    if (valA) valA.textContent = String(result.actionDie);
    if (valR) valR.textContent = String(result.resonanceDie);

    if (result.isCriticalFumble) {
      if (orbA) orbA.classList.add('die-fumble');
      if (tagA) tagA.textContent = 'PIFIA NAT 1';
      if (tagR) tagR.textContent = 'ANULADO';
      if (voidRenderer) voidRenderer.triggerPulse('fumble');
      // En Hard Fault (3ra pifia), golpe catastrófico
      if (result.faultLevel === FAULT_LEVEL.HARD_FAULT) {
        agent.applySanityDamage(25);
      }
    } else {
      if (result.isDoublePrime) {
        if (orbA) orbA.classList.add('die-double-prime');
        if (orbR) orbR.classList.add('die-double-prime');
        if (tagA) tagA.textContent = 'PRIMO ⚡';
        if (tagR) tagR.textContent = 'DOBLE PRIMO ☥';
        if (voidRenderer) voidRenderer.triggerPulse('double');
      } else {
        if (result.isActionPrime && orbA) orbA.classList.add('die-prime');
        if (result.isOmegaSuccess && orbR) orbR.classList.add('die-prime');
        if (tagA) tagA.textContent = result.isActionPrime ? `PRIMO (${result.totalAction})` : `TOTAL ${result.totalAction}`;
        if (tagR) tagR.textContent = result.isOmegaSuccess ? 'OMEGA PRIMO ⚡' : 'NO PRIMO';
        if (result.isOmegaSuccess && voidRenderer) voidRenderer.triggerPulse('omega');
      }
    }

    highlightPrimes(result.actionDie, result.resonanceDie, result.isCriticalFumble);

    // Resolver impacto Bloodeater si hubo éxito
    let strikeSummary = '';
    if (result.isSuccess) {
      const strike = agent.executeStrike(15, result.isOmegaSuccess, result.isDoublePrime);
      if (strike) {
        strikeSummary = ` · ${strike.narrative}`;
      }
    }

    const banner = el('hud-roll-banner');
    if (banner) {
      banner.textContent = `${result.detail}${strikeSummary}`;
      if (result.isDoublePrime) {
        banner.className =
          'px-3 py-2 rounded-xl border text-xs font-mono-tactical font-bold bg-amber-500/15 border-amber-400/60 text-amber-200 shadow-lg';
      } else if (result.isOmegaSuccess && result.isSuccess) {
        banner.className =
          'px-3 py-2 rounded-xl border text-xs font-mono-tactical font-semibold bg-cyan-500/15 border-cyan-400/50 text-cyan-200';
      } else if (result.isCriticalFumble) {
        banner.className =
          'px-3 py-2 rounded-xl border text-xs font-mono-tactical font-bold bg-rose-500/20 border-rose-500/60 text-rose-200';
      } else if (result.isSuccess) {
        banner.className =
          'px-3 py-2 rounded-xl border text-xs font-mono-tactical bg-purple-500/15 border-purple-400/40 text-purple-100';
      } else {
        banner.className =
          'px-3 py-2 rounded-xl border text-xs font-mono-tactical bg-zinc-900/80 border-zinc-700 text-zinc-300';
      }
    }

    syncHud();

    const tone = result.isDoublePrime
      ? 'gold'
      : result.isCriticalFumble
        ? 'crimson'
        : result.isOmegaSuccess
          ? 'cyan'
          : 'purple';

    appendOracleLog(`2d20 #${result.rollIndex}`, `${result.detail}${strikeSummary}`, tone);

    // Narración reactiva en eventos notables (Doble Primo, Éxito Omega, Pifia)
    if (result.isDoublePrime || result.isCriticalFumble || result.isOmegaSuccess) {
      const eventKey = result.isDoublePrime
        ? `Doble Primo [${result.actionDie}, ${result.resonanceDie}]`
        : result.isCriticalFumble
          ? `Pifia Crítica Nivel ${result.faultLevel}`
          : `Éxito Omega con primo ${result.resonanceDie}`;
      triggerOracleNarration(eventKey);
    }
  }

  async function triggerOracleNarration(promptText) {
    const statusEl = el('oracle-conn-badge');
    const ctx = {
      agentName: agent.name,
      role: agent.role.label,
      hp: agent.hp,
      hpMax: agent.hpMax,
      sanPct: Math.round(agent.sanityPercentage()),
      psychosis: agent.isPsychosisActive()
    };

    const reply = await oracle.narrate(promptText, ctx);
    if (statusEl) {
      statusEl.textContent = oracle.online
        ? `🟢 OLLAMA: ${oracle.model}`
        : '🟣 ORÁCULO LOCAL (FALLBACK 0€)';
    }
    appendOracleLog(reply.source, reply.text, ctx.psychosis ? 'crimson' : 'purple');
  }

  // ===========================================================================
  // API DESACOPLADA DE MONTAJE JUGABLE: window.AnusetOmegaHost
  // ===========================================================================

  const AnusetOmegaHost = {
    version: '0.9.0-stage',
    frequency: '189.89.619 Hz',
    diceEngine,
    agent,
    oracle,

    /**
     * Monta el build WebGL / WASM / Go (`anuset-engine`) en la cámara 16:9 en una sola llamada.
     * @param {{
     *   wasmUrl?: string,
     *   wsEndpoint?: string,
     *   vrmScene?: HTMLElement | ((container: HTMLElement) => void),
     *   keepVoidBackdrop?: boolean,
     *   onReady?: (status: object) => void
     * }} config
     */
    async mountEngine(config = {}) {
      const runtimeLayer = el('omega-external-runtime-layer');
      const hudLayer = el('omega-staging-hud');
      const topChip = el('omega-top-stage-chip');

      if (!runtimeLayer) {
        throw new Error('[AnusetOmegaHost] Contenedor #omega-external-runtime-layer no encontrado.');
      }

      hostState.mountedConfig = config;
      hostState.mode = 'ENGINE_MOUNTED';

      // Ocultar calibrador de staging y activar capa runtime 16:9
      if (hudLayer) hudLayer.style.display = 'none';
      if (!config.keepVoidBackdrop && voidRenderer) {
        voidRenderer.stop();
      }

      runtimeLayer.innerHTML = '';
      runtimeLayer.classList.add('is-mounted');

      // 1. Adjuntar escena 3D / VRM si se provee nodo o callback
      if (typeof config.vrmScene === 'function') {
        config.vrmScene(runtimeLayer);
      } else if (config.vrmScene instanceof HTMLElement) {
        runtimeLayer.appendChild(config.vrmScene);
      }

      // 2. Conectar WebSocket al motor nativo Go si se especifica wsEndpoint
      if (config.wsEndpoint) {
        try {
          const ws = new WebSocket(config.wsEndpoint);
          hostState.wsConnection = ws;
          ws.addEventListener('open', () => {
            window.dispatchEvent(new CustomEvent('omega:ws-connected', { detail: { endpoint: config.wsEndpoint } }));
          });
        } catch (err) {
          console.warn('[AnusetOmegaHost] Aviso al abrir wsEndpoint:', err);
        }
      }

      // 3. Instanciar binario Go WASM si se especifica wasmUrl
      if (config.wasmUrl) {
        const importObj = (window.Go && new window.Go().importObject) || { env: {} };
        const resp = await fetch(config.wasmUrl);
        const bytes = await resp.arrayBuffer();
        const wasmRes = await WebAssembly.instantiate(bytes, importObj);
        hostState.wasmInstance = wasmRes.instance;
      }

      if (topChip) {
        topChip.textContent = '[ARGON ENGINE MONTADO · LIVE RUNTIME]';
      }

      const status = this.getStatus();
      if (typeof config.onReady === 'function') {
        config.onReady(status);
      }
      window.dispatchEvent(new CustomEvent('omega:engine-mounted', { detail: status }));
      return status;
    },

    /**
     * Desmonta el runtime externo y restaura el Calibrador Táctico 2d20 + TheVoid 60 FPS.
     */
    unmountEngine() {
      const runtimeLayer = el('omega-external-runtime-layer');
      const hudLayer = el('omega-staging-hud');
      const topChip = el('omega-top-stage-chip');

      if (hostState.wsConnection) {
        try {
          hostState.wsConnection.close();
        } catch (_e) { /* noop */ }
        hostState.wsConnection = null;
      }
      hostState.wasmInstance = null;
      hostState.mountedConfig = null;
      hostState.mode = 'STAGING_CALIBRATOR';

      if (runtimeLayer) {
        runtimeLayer.innerHTML = '';
        runtimeLayer.classList.remove('is-mounted');
      }
      if (hudLayer) hudLayer.style.display = '';
      if (voidRenderer) voidRenderer.start();
      if (topChip) {
        topChip.textContent = '[EN FORJA ACTIVA · SLOT JUGABLE v0.9]';
      }

      window.dispatchEvent(new CustomEvent('omega:engine-unmounted'));
      return this.getStatus();
    },

    getStatus() {
      return {
        mode: hostState.mode,
        version: this.version,
        frequency: this.frequency,
        psychosisActive: agent.isPsychosisActive(),
        sanityPct: Math.round(agent.sanityPercentage()),
        fumbleStreak: diceEngine.accumulatedFumbles(),
        ollamaOnline: oracle.online,
        codexSource: codexState.source,
        activeClassCode: codexState.activeClass ? codexState.activeClass.code : null,
        activeFactionId: codexState.activeFaction ? codexState.activeFaction.id : null,
        mountedConfig: hostState.mountedConfig
      };
    },

    /**
     * Devuelve el Códice Canónico completo (144 Clases Modulares, 12 Facciones Unificadas y Selección Activa)
     * para acoplamiento inmediato al montar el runtime 3D/WASM con mountEngine(...).
     */
    getCanonicalCodex() {
      return {
        classes144: codexState.classes144,
        factions: codexState.factions,
        activeSelection: {
          classData: codexState.activeClass,
          factionData: codexState.activeFaction,
          triadRole: agent.role.id,
          tacticalModifier: agent.totalTacticalModifier(),
          armorClass: agent.armorClass,
          critThreshold: agent.critThreshold,
          damageReduction: agent.damageReduction,
          hpMax: agent.hpMax,
          sanMax: agent.sanMax,
          voidAffinityPct: agent.voidAffinityPct,
          factionSynergy: agent.hasFactionClassSynergy,
          seinenLore: codexState.activeLore
        }
      };
    },

    /**
     * Ejecuta programáticamente el simulador Monte Carlo híbrido (ARM64 :18989 500k -> Local 100k).
     * @param {number} [dc]
     * @param {number} [mod]
     */
    async runMonteCarloSimulation(dc, mod) {
      const targetDC = typeof dc === 'number' ? dc : (Number(el('hud-target-dc')?.value) || 16);
      const targetMod = typeof mod === 'number' ? mod : agent.totalTacticalModifier();
      return executeHybridMonteCarlo(targetDC, targetMod);
    }
  };

  window.AnusetOmegaHost = AnusetOmegaHost;

  // ===========================================================================
  // 7. INICIALIZACIÓN DOM
  // ===========================================================================

  function bindUiEvents() {
    const voidCanvas = /** @type {HTMLCanvasElement | null} */ (el('the-void-canvas'));
    if (voidCanvas) {
      voidRenderer = new TheVoidCanvasRenderer(voidCanvas);
      AnusetOmegaHost.voidRenderer = voidRenderer;
      voidRenderer.start();
    }

    // Botones del Calibrador 2d20
    const btnRoll = el('btn-roll-2d20');
    if (btnRoll) btnRoll.addEventListener('click', () => handleRollExecution());

    const btnForceDouble = el('btn-force-double-prime');
    if (btnForceDouble) {
      btnForceDouble.addEventListener('click', () => {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19];
        const pA = primes[cryptoRoll(primes.length) - 1];
        const pR = primes[cryptoRoll(primes.length) - 1];
        handleRollExecution(pA, pR);
      });
    }

    const btnForceFumble = el('btn-force-fumble');
    if (btnForceFumble) {
      btnForceFumble.addEventListener('click', () => {
        handleRollExecution(1, cryptoRoll(20));
      });
    }

    // Simulador Monte Carlo Híbrido 500k (ARM64 :18989 / Local)
    const btnMonteCarlo = el('btn-monte-carlo-500k');
    if (btnMonteCarlo) {
      btnMonteCarlo.addEventListener('click', () => {
        handleMonteCarloExecution();
      });
    }

    // Forjador de Agente: Matriz Modular de 144 Clases & Facciones Canónicas
    populateCodexDropdowns();
    renderCodexClassGrid();
    loadCanonicalCodexJson();

    const facSelect = el('codex-faction-select');
    if (facSelect) {
      facSelect.addEventListener('change', (ev) => {
        selectCodexBuild(null, ev.target.value, true);
      });
    }

    const affFilter = el('codex-affinity-filter');
    if (affFilter) {
      affFilter.addEventListener('change', (ev) => {
        const val = ev.target.value;
        codexState.filterAffinity = val;
        if (val.startsWith('FACTION:')) {
          const fid = val.slice(8);
          selectCodexBuild(null, fid, true);
        } else {
          renderCodexClassGrid();
        }
      });
    }

    const searchInput = el('codex-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (ev) => {
        codexState.searchQuery = ev.target.value || '';
        renderCodexClassGrid();
      });
    }

    const triadPills = document.querySelectorAll('[data-codex-triad]');
    triadPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const tVal = pill.getAttribute('data-codex-triad') || 'ALL';
        codexState.filterTriad = tVal;
        triadPills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        renderCodexClassGrid();
      });
    });

    const btnCodexReset = el('btn-codex-reset');
    if (btnCodexReset) {
      btnCodexReset.addEventListener('click', () => {
        codexState.filterTriad = 'ALL';
        codexState.filterAffinity = 'ALL';
        codexState.searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (affFilter) affFilter.value = 'ALL';
        triadPills.forEach((p) => {
          if (p.getAttribute('data-codex-triad') === 'ALL') p.classList.add('is-active');
          else p.classList.remove('is-active');
        });
        renderCodexClassGrid();
      });
    }

    const btnCodexRandom = el('btn-codex-random');
    if (btnCodexRandom) {
      btnCodexRandom.addEventListener('click', () => {
        const rndClass = codexState.classes144[cryptoRoll(codexState.classes144.length) - 1];
        const rndFaction = codexState.factions[cryptoRoll(codexState.factions.length) - 1];
        if (rndClass && rndFaction) {
          selectCodexBuild(rndClass.class_id, rndFaction.id, true);
        }
      });
    }

    // Controles de Cordura (SAN %) y Psicosis
    const sanSlider = el('hud-san-slider');
    if (sanSlider) {
      sanSlider.addEventListener('input', (ev) => {
        const prevPsych = agent.isPsychosisActive();
        const nextPsych = agent.setSanity(Number(ev.target.value));
        syncHud();
        if (!prevPsych && nextPsych) {
          if (voidRenderer) voidRenderer.triggerPulse('fumble');
          appendOracleLog('PSICOSIS <15%', '¡Umbral de Psicosis cruzado! Distorsión cromática 619 Hz activa y desasistencia de Anuu.', 'crimson');
          triggerOracleNarration('Umbral de Psicosis activo bajo 15% de cordura');
        }
      });
    }

    const btnPsychosisTest = el('btn-trigger-psychosis');
    if (btnPsychosisTest) {
      btnPsychosisTest.addEventListener('click', () => {
        const currentlyPsycho = agent.isPsychosisActive();
        if (currentlyPsycho) {
          agent.setSanity(85);
          syncHud();
          appendOracleLog('ESTABILIZACIÓN', 'Cordura restaurada al 85%. Interferencia cromática disipada.', 'cyan');
        } else {
          // Si lleva el Amuleto inmune, avisar con fidelidad al motor Go
          agent.setSanity(9);
          syncHud();
          if (agent.isPsychosisActive()) {
            if (voidRenderer) voidRenderer.triggerPulse('fumble');
            appendOracleLog('PSICOSIS <15%', 'SAN reducida al 9%: Modo Psicosis y distorsión cromática activados en el HUD.', 'crimson');
            triggerOracleNarration('Colapso de cordura al 9% y activación de Psicosis');
          } else {
            appendOracleLog('INMUNIDAD', 'SAN al 9%, pero el Amuleto del Panteón Caído bloquea el estado de Psicosis.', 'gold');
          }
        }
      });
    }

    // Simulador de Golpe Letal -> Bendición de Kilonova
    const btnLethal = el('btn-simulate-lethal');
    if (btnLethal) {
      btnLethal.addEventListener('click', () => {
        const dmgRes = agent.applyDamage(120);
        const stageShell = el('omega-viewport-mount');
        if (dmgRes.kilonovaTriggered) {
          if (voidRenderer) voidRenderer.triggerPulse('kilonova');
          if (stageShell) {
            stageShell.classList.remove('kilonova-burst');
            void stageShell.offsetWidth;
            stageShell.classList.add('kilonova-burst');
          }
          appendOracleLog('KILONOVA 🌟', dmgRes.narrative, 'gold');
          triggerOracleNarration('Activación de la Bendición de Kilonova ante golpe letal');
        } else {
          if (voidRenderer) voidRenderer.triggerPulse('fumble');
          appendOracleLog('DAÑO LETAL', dmgRes.narrative, 'crimson');
        }
        syncHud();
      });
    }

    // Purga en Horno Alquímico 89
    const btnOven = el('btn-purge-oven89');
    if (btnOven) {
      btnOven.addEventListener('click', () => {
        diceEngine.resetFaults();
        agent.purgeAtAlchemicalOven89();
        if (voidRenderer) voidRenderer.triggerPulse('omega');
        syncHud();
        appendOracleLog('HORNO 89 🔥', 'Purga a 619 Hz completada: HP/SAN al 100%, fallos 2d20 a 0 y Bendición de Kilonova recargada.', 'cyan');
        triggerOracleNarration('Purga completa en el Horno Alquímico 89');
      });
    }

    // Selectores de Tríada, Bloodeater y Sinergia
    const roleSelect = el('hud-role-select');
    if (roleSelect) {
      roleSelect.addEventListener('change', (ev) => {
        agent.setRole(ev.target.value);
        syncHud();
        appendOracleLog('TRÍADA', `Especialización cambiada a ${agent.role.label} (${agent.role.summary}).`, 'purple');
      });
    }

    const beSelect = el('hud-bloodeater-select');
    if (beSelect) {
      beSelect.addEventListener('change', (ev) => {
        agent.equipBloodeater(ev.target.value);
        syncHud();
        const label = agent.bloodeater ? agent.bloodeater.name : 'Ninguno (HP_Max restaurado)';
        appendOracleLog('BLOODEATER 🩸', `Vínculo sacrificial actualizado: ${label}.`, 'crimson');
      });
    }

    const synergyChk = el('hud-synergy-toggle');
    if (synergyChk) {
      synergyChk.addEventListener('change', (ev) => {
        agent.triadSynergyActive = Boolean(ev.target.checked);
        syncHud();
      });
    }

    // Modo Vacío Puro (minimizar HUD para contemplar TheVoid 60 FPS) & Pantalla Completa
    const btnToggleHud = el('btn-toggle-void-view');
    if (btnToggleHud) {
      btnToggleHud.addEventListener('click', () => {
        const hud = el('omega-staging-hud');
        if (!hud) return;
        const minimized = hud.classList.toggle('hud-minimized');
        btnToggleHud.textContent = minimized ? '🎛️ Mostrar HUD' : '👁️ Vacío Puro';
      });
    }

    const btnFullscreen = el('btn-stage-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        const stage = el('omega-viewport-mount');
        if (!stage) return;
        if (!document.fullscreenElement) {
          stage.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Consola Argon Oracle (envío manual + sondeo Ollama)
    const oracleForm = el('omega-oracle-form');
    if (oracleForm) {
      oracleForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = el('omega-oracle-input');
        if (!input || !input.value.trim()) return;
        const q = input.value.trim();
        input.value = '';
        triggerOracleNarration(q);
      });
    }

    const btnProbeOllama = el('btn-probe-ollama');
    if (btnProbeOllama) {
      btnProbeOllama.addEventListener('click', async () => {
        const badge = el('oracle-conn-badge');
        if (badge) badge.textContent = '⏳ SONDEANDO 127.0.0.1:11434...';
        const status = await oracle.probe();
        if (status.online) {
          if (badge) badge.textContent = `🟢 OLLAMA: ${status.model} (${status.latencyMs}ms)`;
          appendOracleLog('ARGON ORACLE', `Enlace local establecido con Ollama (${status.model}) a 0 € / mes.`, 'cyan');
        } else {
          if (badge) badge.textContent = '🟣 CÓDICE LOCAL ACTIVO (OLLAMA OFFLINE)';
          appendOracleLog('ARGON ORACLE', 'Puerto 11434 no accesible desde navegador; sintetizador narrativo Seinen offline activo.', 'purple');
        }
      });
    }

    // Estado inicial y sondeo silencioso
    syncHud();
    appendOracleLog(
      'ARGON STAGE',
      'Cámara de montaje 16:9 inicializada a 189.89.619 Hz. Calibrador 2d20 Resonancia Prima listo; window.AnusetOmegaHost expuesto.',
      'cyan'
    );
    oracle.probe().then((st) => {
      const badge = el('oracle-conn-badge');
      if (badge && st.online) {
        badge.textContent = `🟢 OLLAMA: ${st.model}`;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUiEvents);
  } else {
    bindUiEvents();
  }
})();
