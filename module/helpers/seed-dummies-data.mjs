/**
 * SHIFT VTT — Sandbox / test-content fixture data (LOCALIZED, single set).
 *
 * AUTO-GENERATED. ONE set of fully-configured test fixtures whose translatable
 * strings are {"pt-BR":..., en:...} pairs (a plain string means it's identical in
 * both languages). seed-dummies.mjs resolves them to Foundry's ACTIVE language at
 * load and re-localizes the seeded documents whenever the world language changes,
 * so there is a single folder tree — never one folder per language. Every fixture
 * carries a raster .webp icon (never svg). Each has a stable language-independent
 * `id` used to track/re-localize its seeded document.
 *
 * Cross-actor reference arrays (party members/codex, vehicle crew, location NPCs,
 * quest links) are EMPTY by design — a compendium can't hold live world UUIDs; the
 * GM drags refs in after import. Adversaries carry a token `disposition`: 0
 * (neutral ally → "NPCs" folder) or -1 (hostile → "Criaturas"/"Creatures" folder).
 * Coverage spans all 5 Actor and 5 Item types, every Trait category,
 * exhausted/temporary/locked/hidden/non-rollable Traits, Scale overrides up AND
 * down, the full Adversary Special-Trait matrix, Scaled Up Techniques, Party
 * quests, and Landmarks. To extend: edit these arrays — never hand-edit the LevelDB.
 */

export const SANDBOX = {
  "actors": [
    {
      "id": "aldric-o-guardiao-firme",
      "type": "character",
      "img": "icons/environment/people/infantry-armored.webp",
      "tokenImg": "icons/environment/people/infantry-armored.webp",
      "name": {
        "pt-BR": "Aldric, o Guardião Firme",
        "en": "Aldric the Steadfast Guardian"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Herói baseline limpo (Escala 1). Cores travados d6/d8/d10, um Pack, dois focos com keywords e drawbacks, e técnicas narrativa + mecânica de usos limitados. Testa a rolagem padrão e o auto-shift.</p>",
          "en": "<p>Clean baseline hero (Scale 1). Locked Cores d6/d8/d10, one Pack, two Focuses with keywords and drawbacks, and narrative + mechanical limited-use techniques. Tests the standard roll and auto-shift.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Cavaleiro veterano que protege os fracos",
          "en": "Veteran knight who protects the weak"
        },
        "pronouns": {
          "pt-BR": "ele/dele",
          "en": "he/him"
        },
        "xp": {
          "value": 6,
          "session": 2
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo travado em d6 (o mais forte). Testa core locked com drawbacks.</p>",
              "en": "<p>Body Core locked at d6 (the strongest). Tests a locked core with drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Teimoso",
                "en": "Stubborn"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente travado em d8. Testa um core de força intermediária.</p>",
              "en": "<p>Mind Core locked at d8. Tests a mid-strength core.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma travado em d10. Testa o core mais fraco do trio baseline.</p>",
              "en": "<p>Soul Core locked at d10. Tests the weakest core of the baseline trio.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Mochila do Guardião",
            "en": "Guardian's Pack"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Pack em d8. Testa um Pack rolável sem keywords nem drawbacks.</p>",
              "en": "<p>Pack trait at d8. Tests a rollable Pack with no keywords or drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Corda, rações, lanterna, kit de primeiros socorros",
              "en": "Rope, rations, lantern, first-aid kit"
            },
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/swords/greatsword-crossguard-blue.webp",
          "name": {
            "pt-BR": "Combate com Escudo",
            "en": "Shield Fighting"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco marcial em d6 com keywords e drawbacks. Testa um foco de personagem completo.</p>",
              "en": "<p>Martial Focus at d6 with keywords and drawbacks. Tests a fully fleshed-out character Focus.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Defensivo",
                "en": "Defensive"
              },
              {
                "pt-BR": "Provocar",
                "en": "Taunt"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Pesado",
                "en": "Heavy"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Fé Curativa",
            "en": "Healing Faith"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco de cura em d10 com uma keyword. Testa um segundo foco de dado diferente.</p>",
              "en": "<p>Healing Focus at d10 with one keyword. Tests a second Focus on a different die.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Restaurador",
                "en": "Restorative"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Defensivo",
            "en": "Defensive"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Quando você protege um aliado, ganha vantagem na próxima defesa.</p>",
              "en": "<p>When you protect an ally, you gain advantage on your next defense.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Provocar",
            "en": "Taunt"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você força inimigos a focarem em você em vez de seus aliados.</p>",
              "en": "<p>You force enemies to focus on you instead of your allies.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/nature/cornucopia-orange.webp",
          "name": {
            "pt-BR": "Restaurador",
            "en": "Restorative"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Suas curas removem um Drawback temporário do alvo.</p>",
              "en": "<p>Your healing removes one temporary Drawback from the target.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Teimoso",
            "en": "Stubborn"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você reluta em recuar mesmo quando seria sensato.</p>",
              "en": "<p>You are reluctant to retreat even when it would be wise.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Pesado",
            "en": "Heavy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seu equipamento o deixa lento e barulhento.</p>",
              "en": "<p>Your gear leaves you slow and noisy.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/clock-spinning-gold-pink.webp",
          "name": {
            "pt-BR": "Postura de Sentinela",
            "en": "Sentinel Stance"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica narrativa <strong>À Vontade</strong>: uso ilimitado, sem recarga. Testa a exibição do símbolo de infinito (∞).</p>",
              "en": "<p>An <strong>At Will</strong> narrative technique: unlimited use, no recharge. Tests the infinity (∞) display.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "narrative",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": false,
              "safeRest": false,
              "unsafeRest": false,
              "atWill": true
            },
            "uses": {
              "value": 0,
              "max": 0
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/light/explosion-star-blue.webp",
          "name": {
            "pt-BR": "Investida Protetora",
            "en": "Protective Charge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica mecânica com 2 usos por descanso seguro. Testa contagem de usos limitados.</p>",
              "en": "<p>Mechanical technique with 2 uses per safe rest. Tests limited-use counting.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "mechanical",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": false,
              "safeRest": true,
              "unsafeRest": false
            },
            "uses": {
              "value": 2,
              "max": 2
            }
          }
        }
      ]
    },
    {
      "id": "lyra-veu-de-estrelas",
      "type": "character",
      "img": "icons/weapons/wands/wand-carved-pink.webp",
      "tokenImg": "icons/weapons/wands/wand-carved-pink.webp",
      "name": {
        "pt-BR": "Lyra Véu-de-Estrelas",
        "en": "Lyra Starveil"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Conjuradora de Escala 2 cujo foco tem override de Escala (custom 1, menor que a dona) e uma técnica Scaled Up ligada a esse foco. Testa override de Escala e o vínculo Scaled Up.</p>",
          "en": "<p>Scale 2 spellcaster whose Focus has a Scale override (custom 1, lower than its owner) and a Scaled Up technique tied to that Focus. Tests Scale override and the Scaled Up link.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Maga errante que canaliza a luz das estrelas",
          "en": "Wandering mage who channels starlight"
        },
        "pronouns": {
          "pt-BR": "ela/dela",
          "en": "she/her"
        },
        "xp": {
          "value": 10,
          "session": 1
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo d10, frágil como esperado de uma conjuradora.</p>",
              "en": "<p>Body Core at d10, frail as you'd expect of a spellcaster.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente d6, sua maior força.</p>",
              "en": "<p>Mind Core at d6, her greatest strength.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma d8.</p>",
              "en": "<p>Soul Core at d8.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Bolsa de Componentes",
            "en": "Component Pouch"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Pack d10 com reagentes mágicos.</p>",
              "en": "<p>Pack trait at d10 with magical reagents.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Pó de estrela, velas, grimório de bolso",
              "en": "Stardust, candles, pocket grimoire"
            },
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/fire/beam-jet-stream-blue.webp",
          "name": {
            "pt-BR": "Magia Estelar",
            "en": "Star Magic"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco com override de Escala custom em valor 1 (MENOR que a dona, Escala 2). Testa override de Escala para baixo. É o alvo da técnica Scaled Up.</p>",
              "en": "<p>Focus with a custom Scale override at value 1 (LOWER than its owner, Scale 2). Tests a downward Scale override. It is the target of the Scaled Up technique.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": true,
              "value": 2
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Luminoso",
                "en": "Luminous"
              },
              {
                "pt-BR": "À Distância",
                "en": "Ranged"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Conspícuo",
                "en": "Conspicuous"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/nature/beam-hand-leaves-green.webp",
          "name": {
            "pt-BR": "Vínculo Astral",
            "en": "Astral Bond"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Segundo foco d8, sem override de escala, para contraste com Magia Estelar.</p>",
              "en": "<p>Second Focus at d8, with no scale override, to contrast with Star Magic.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Premonição",
                "en": "Premonition"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue-yellow.webp",
          "name": {
            "pt-BR": "Luminoso",
            "en": "Luminous"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Sua magia emite luz brilhante que cega quem olha diretamente.</p>",
              "en": "<p>Your magic gives off a brilliant light that blinds anyone who looks directly at it.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue.webp",
          "name": {
            "pt-BR": "À Distância",
            "en": "Ranged"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você pode atingir alvos muito além do alcance normal.</p>",
              "en": "<p>You can strike targets far beyond normal reach.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Premonição",
            "en": "Premonition"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Vislumbres do futuro lhe dão vantagem ao reagir a perigos.</p>",
              "en": "<p>Glimpses of the future grant you advantage when reacting to danger.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/beam-impact-purple.webp",
          "name": {
            "pt-BR": "Conspícuo",
            "en": "Conspicuous"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Sua magia luminosa revela sua posição a todos ao redor.</p>",
              "en": "<p>Your luminous magic reveals your position to everyone around you.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/control/buff-flight-wings-runes-blue.webp",
          "name": {
            "pt-BR": "Ascensão Estelar",
            "en": "Stellar Ascension"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica Scaled Up ligada ao foco Magia Estelar, tratando-o como Escala 2. Testa o vínculo Scaled Up por nome de foco.</p>",
              "en": "<p>Scaled Up technique tied to the Star Magic Focus, treating it as Scale 2. Tests the Scaled Up link by focus name.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "scaledUp",
            "focus": {
              "traitId": "",
              "traitName": {
                "pt-BR": "Magia Estelar",
                "en": "Star Magic"
              },
              "scale": 2
            },
            "recharges": {
              "session": true,
              "safeRest": true,
              "unsafeRest": false
            },
            "uses": {
              "value": 0,
              "max": 0
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/clock-spinning-gold-pink.webp",
          "name": {
            "pt-BR": "Leitura de Augúrios",
            "en": "Reading the Omens"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica narrativa de adivinhação com 1 uso por sessão. Testa a contagem de usos limitados em uma técnica narrativa.</p>",
              "en": "<p>Narrative divination technique with 1 use per session. Tests limited-use counting on a narrative technique.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "narrative",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": true,
              "safeRest": false,
              "unsafeRest": false
            },
            "uses": {
              "value": 1,
              "max": 1
            }
          }
        }
      ]
    },
    {
      "id": "bram-mao-quebrada",
      "type": "character",
      "img": "icons/environment/people/cavalry.webp",
      "tokenImg": "icons/environment/people/cavalry.webp",
      "name": {
        "pt-BR": "Bram Mão-Quebrada",
        "en": "Bram Brokenhand"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Veterano ferido com um core EXAUSTO (exhausted, currentDie d12), um foco abaixo do máximo (maxDie d4 / currentDie d8), XP alto e vários drawbacks. Testa estados de exaustão e dado degradado.</p>",
          "en": "<p>Wounded veteran with one EXHAUSTED core (exhausted, currentDie d12), a Focus below its maximum (maxDie d4 / currentDie d8), high XP, and several drawbacks. Tests exhaustion states and a degraded die.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Mercenário marcado por guerras antigas",
          "en": "Mercenary marked by old wars"
        },
        "pronouns": {
          "pt-BR": "ele/dele",
          "en": "he/him"
        },
        "xp": {
          "value": 24,
          "session": 3
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo EXAUSTO: exhausted true e currentDie d12 (max d6). Testa a apresentação de um core exausto.</p>",
              "en": "<p>EXHAUSTED Body Core: exhausted true and currentDie d12 (max d6). Tests how an exhausted core is presented.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d12",
            "exhausted": true,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Cicatrizes Antigas",
                "en": "Old Scars"
              },
              {
                "pt-BR": "Mancando",
                "en": "Limping"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente d8, degradado para d10 mas não exausto. Testa um shift parcial.</p>",
              "en": "<p>Mind Core d8, degraded to d10 but not exhausted. Tests a partial shift.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma d8 intacto.</p>",
              "en": "<p>Soul Core d8, intact.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Saco de Sobrevivência",
            "en": "Survival Bag"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Pack d8 surrado pela estrada.</p>",
              "en": "<p>Pack trait d8, worn down by the road.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Bandagens, pederneira, faca cega",
              "en": "Bandages, flint and steel, dull knife"
            },
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/swords/greatsword-crossguard-blue.webp",
          "name": {
            "pt-BR": "Veterano de Mil Batalhas",
            "en": "Veteran of a Thousand Battles"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco ABAIXO do máximo: maxDie d4 mas currentDie d8 (degradado). Testa um foco forte que já sofreu shifts. Carrega vários drawbacks.</p>",
              "en": "<p>Focus BELOW its maximum: maxDie d4 but currentDie d8 (degraded). Tests a strong Focus that has already taken shifts. Carries several drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d4",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              "Brutal"
            ],
            "drawbacks": [
              {
                "pt-BR": "Temperamental",
                "en": "Hot-Tempered"
              },
              {
                "pt-BR": "Memórias de Guerra",
                "en": "War Memories"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": "Brutal",
          "system": {
            "description": {
              "pt-BR": "<p>Seus golpes deixam ferimentos difíceis de curar.</p>",
              "en": "<p>Your blows leave wounds that are hard to heal.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Cicatrizes Antigas",
            "en": "Old Scars"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Velhos ferimentos doem com o frio e o esforço.</p>",
              "en": "<p>Old wounds ache in the cold and under strain.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/skills/toxins/cup-goblet-poisoned-spilled.webp",
          "name": {
            "pt-BR": "Mancando",
            "en": "Limping"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Uma perna ferida torna corridas e saltos arriscados.</p>",
              "en": "<p>An injured leg makes running and jumping risky.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Temperamental",
            "en": "Hot-Tempered"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você perde a paciência com facilidade em momentos tensos.</p>",
              "en": "<p>You lose your patience easily in tense moments.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/barrier-fire-pink.webp",
          "name": {
            "pt-BR": "Memórias de Guerra",
            "en": "War Memories"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Lembranças de batalhas o assombram em momentos de calma.</p>",
              "en": "<p>Memories of past battles haunt you in moments of calm.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/day-night-sunset-sunrise.webp",
          "name": {
            "pt-BR": "Resistência Obstinada",
            "en": "Stubborn Endurance"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica mecânica de 1 uso que recarrega em descanso seguro. Testa recarga por descanso de um veterano.</p>",
              "en": "<p>Mechanical technique with 1 use that recharges on a safe rest. Tests a veteran's rest-recharge.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "mechanical",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": false,
              "safeRest": true,
              "unsafeRest": false
            },
            "uses": {
              "value": 1,
              "max": 1
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/swords/greatsword-crossguard-blue.webp",
          "name": {
            "pt-BR": "Presença Cicatrizada",
            "en": "Scarred Presence"
          },
          "system": {
            "description": {
              "pt-BR": "<p>As guerras deixaram em Bram mais que a mão quebrada: deixaram uma fama que entra na sala antes dele. Um olhar duro, uma cicatriz exposta, e tabernas inteiras escolhem o silêncio.</p>",
              "en": "<p>The wars left Bram more than a broken hand: they left a reputation that walks into the room ahead of him. One hard stare, one bared scar, and whole taverns choose silence.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Intimidar",
                "en": "Intimidate"
              },
              {
                "pt-BR": "Reputação",
                "en": "Reputation"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Marcado",
                "en": "Marked"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Intimidar",
            "en": "Intimidate"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Dobrar a vontade alheia pela ameaça, sem precisar sacar uma lâmina.</p>",
              "en": "<p>Bend others' will through menace, without ever drawing a blade.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Reputação",
            "en": "Reputation"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seu nome de mercenário abre portas e fecha bocas em terras tocadas pela guerra.</p>",
              "en": "<p>His mercenary name opens doors and shuts mouths across war-touched lands.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Marcado",
            "en": "Marked"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Inimigos antigos reconhecem o rosto de Bram e raramente o deixam passar em paz.</p>",
              "en": "<p>Old enemies recognize Bram's face and rarely let him pass in peace.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "nessa-sete-caminhos",
      "type": "character",
      "img": "icons/environment/people/archer.webp",
      "tokenImg": "icons/environment/people/archer.webp",
      "name": {
        "pt-BR": "Nessa Sete-Caminhos",
        "en": "Nessa Sevenroads"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Aventureira versátil com vários focos de dados diferentes, um foco TEMPORÁRIO, uma técnica à vontade (uses.max 0) e um traço travado. Testa focos temporários, locked e técnica ilimitada.</p>",
          "en": "<p>Versatile adventurer with several Focuses on different dice, one TEMPORARY Focus, an at-will technique (uses.max 0), and a locked trait. Tests temporary Focuses, locked, and an unlimited technique.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Batedora curiosa que domina muitos ofícios",
          "en": "Curious scout who masters many trades"
        },
        "pronouns": {
          "pt-BR": "elu/delu",
          "en": "they/them"
        },
        "xp": {
          "value": 14,
          "session": 2
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo d8.</p>",
              "en": "<p>Body Core d8.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente d6, sua maior força.</p>",
              "en": "<p>Mind Core d6, their greatest strength.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma d10.</p>",
              "en": "<p>Soul Core d10.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Mochila de Viagem",
            "en": "Travel Pack"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Pack d8 cheio de ferramentas variadas.</p>",
              "en": "<p>Pack trait d8 full of varied tools.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Mapas, gazua, luneta, corda de seda",
              "en": "Maps, lockpick, spyglass, silk rope"
            },
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/bows/bow-recurve-black.webp",
          "name": {
            "pt-BR": "Arco e Flecha",
            "en": "Bow and Arrow"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco à distância d6 com keywords. Um dos vários focos de dados diferentes.</p>",
              "en": "<p>Ranged Focus d6 with keywords. One of several Focuses on different dice.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Preciso",
                "en": "Precise"
              },
              {
                "pt-BR": "Silencioso",
                "en": "Silent"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/nature/beam-hand-leaves-green.webp",
          "name": {
            "pt-BR": "Conhecimento de Trilhas",
            "en": "Trailcraft"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco de exploração d8, dado diferente dos demais focos.</p>",
              "en": "<p>Exploration Focus d8, a different die from the other Focuses.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Rastreador",
                "en": "Tracker"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/nature/beam-hand-leaves-green.webp",
          "name": {
            "pt-BR": "Bênção do Druida (Temporário)",
            "en": "Druid's Blessing (Temporary)"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco TEMPORÁRIO (temporary true) d10, concedido por um aliado. Testa traços temporários que somem no descanso.</p>",
              "en": "<p>TEMPORARY Focus (temporary true) d10, granted by an ally. Tests temporary traits that vanish on a rest.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": true,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Natureza Viva",
                "en": "Living Nature"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Juramento de Guilda",
            "en": "Guild Oath"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco TRAVADO d8 (locked true) que não pode ser editado nem removido. Testa o estado locked de um traço.</p>",
              "en": "<p>LOCKED Focus d8 (locked true) that cannot be edited or removed. Tests the locked state of a trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Reputação",
                "en": "Reputation"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue.webp",
          "name": {
            "pt-BR": "Preciso",
            "en": "Precise"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seus tiros acertam pontos vitais com facilidade.</p>",
              "en": "<p>Your shots strike vital points with ease.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Silencioso",
            "en": "Silent"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você ataca sem revelar sua posição.</p>",
              "en": "<p>You attack without revealing your position.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/nature/cornucopia-orange.webp",
          "name": {
            "pt-BR": "Rastreador",
            "en": "Tracker"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você segue pistas e pegadas mesmo em terreno difícil.</p>",
              "en": "<p>You follow trails and tracks even over difficult terrain.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue-yellow.webp",
          "name": {
            "pt-BR": "Natureza Viva",
            "en": "Living Nature"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Plantas e animais respondem ao seu chamado.</p>",
              "en": "<p>Plants and animals answer your call.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Reputação",
            "en": "Reputation"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seu nome de guilda abre portas em cidades distantes.</p>",
              "en": "<p>Your guild name opens doors in distant cities.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/arrows-circling-green.webp",
          "name": {
            "pt-BR": "Tiro Certeiro",
            "en": "Sure Shot"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica mecânica À VONTADE (uses.max 0). Testa técnica de usos ilimitados.</p>",
              "en": "<p>AT-WILL mechanical technique (uses.max 0). Tests an unlimited-use technique.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "mechanical",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": true,
              "safeRest": true,
              "unsafeRest": false
            },
            "uses": {
              "value": 0,
              "max": 0
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/clock-spinning-gold-pink.webp",
          "name": {
            "pt-BR": "Improviso de Campo",
            "en": "Field Improvisation"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica narrativa de improviso. Testa uma segunda técnica narrativa em personagem versátil.</p>",
              "en": "<p>Narrative improvisation technique. Tests a second narrative technique on a versatile character.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "narrative",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": true,
              "safeRest": false,
              "unsafeRest": false
            },
            "uses": {
              "value": 0,
              "max": 0
            }
          }
        }
      ]
    },
    {
      "id": "korga-punho-de-ferro",
      "type": "character",
      "img": "icons/environment/people/charge.webp",
      "tokenImg": "icons/environment/people/charge.webp",
      "name": {
        "pt-BR": "Korga Punho-de-Ferro",
        "en": "Korga Ironfist"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Brutamonte arriscado: core carregado de drawbacks, foco com muitas keywords, técnica com recarga \"Em qualquer descanso\" (Safe Rest continua aceso) e um Pack. Testa rolagens arriscadas e recarga em qualquer descanso.</p>",
          "en": "<p>Reckless bruiser: a core loaded with drawbacks, a Focus with many keywords, a technique that recharges on any rest (Safe Rest stays lit), and a Pack. Tests Risky rolls and any-rest recharge.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Gladiadora imprudente que vive no limite",
          "en": "Reckless gladiator who lives on the edge"
        },
        "pronouns": {
          "pt-BR": "ela/dela",
          "en": "she/her"
        },
        "xp": {
          "value": 8,
          "session": 4
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo d4 (o mais forte) carregado de drawbacks. Testa um core forte porém problemático.</p>",
              "en": "<p>Body Core d4 (the strongest) loaded with drawbacks. Tests a strong but problematic core.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d4",
            "currentDie": "d4",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Imprudente",
                "en": "Reckless"
              },
              {
                "pt-BR": "Sangue Quente",
                "en": "Hot-Blooded"
              },
              {
                "pt-BR": "Cabeça-Dura",
                "en": "Hard-Headed"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente d12, sua maior fraqueza.</p>",
              "en": "<p>Mind Core d12, her greatest weakness.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d12",
            "currentDie": "d12",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma d8.</p>",
              "en": "<p>Soul Core d8.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Saco de Pancadaria",
            "en": "Brawler's Sack"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Pack d10 com tralhas de arena.</p>",
              "en": "<p>Pack trait d10 with arena junk.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Correntes, soqueira, frasco de bebida forte",
              "en": "Chains, brass knuckles, flask of strong drink"
            },
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/swords/greatsword-crossguard-blue.webp",
          "name": {
            "pt-BR": "Fúria de Arena",
            "en": "Arena Fury"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foco d6 com MUITAS keywords. Testa um foco com diversos modificadores de keyword.</p>",
              "en": "<p>Focus d6 with MANY keywords. Tests a Focus with several keyword modifiers.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Devastador",
                "en": "Devastating"
              },
              {
                "pt-BR": "Intimidador",
                "en": "Intimidating"
              },
              {
                "pt-BR": "Imparável",
                "en": "Unstoppable"
              },
              {
                "pt-BR": "Frenético",
                "en": "Frenzied"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Descontrolado",
                "en": "Out of Control"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/beam-impact-purple.webp",
          "name": {
            "pt-BR": "Imprudente",
            "en": "Reckless"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você se lança ao perigo sem pensar nas consequências.</p>",
              "en": "<p>You throw yourself into danger without thinking of the consequences.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/barrier-fire-pink.webp",
          "name": {
            "pt-BR": "Sangue Quente",
            "en": "Hot-Blooded"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Provocações fáceis o levam a brigas desnecessárias.</p>",
              "en": "<p>Easy provocations drag you into needless fights.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Cabeça-Dura",
            "en": "Hard-Headed"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Você ignora conselhos e planos mais cautelosos.</p>",
              "en": "<p>You ignore advice and more cautious plans.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Descontrolado",
            "en": "Out of Control"
          },
          "system": {
            "description": {
              "pt-BR": "<p>No auge da fúria você pode atingir aliados por engano.</p>",
              "en": "<p>At the height of your fury you may strike allies by mistake.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Devastador",
            "en": "Devastating"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seus golpes quebram escudos e armaduras.</p>",
              "en": "<p>Your blows shatter shields and armor.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue.webp",
          "name": {
            "pt-BR": "Intimidador",
            "en": "Intimidating"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Sua presença faz inimigos hesitarem.</p>",
              "en": "<p>Your presence makes enemies hesitate.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Imparável",
            "en": "Unstoppable"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Nada interrompe seu avanço uma vez iniciado.</p>",
              "en": "<p>Nothing halts your advance once it has begun.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/light/explosion-star-blue-yellow.webp",
          "name": {
            "pt-BR": "Frenético",
            "en": "Frenzied"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Quanto mais ferida, mais perigosa você se torna.</p>",
              "en": "<p>The more wounded you are, the more dangerous you become.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "technique",
          "img": "icons/magic/time/day-night-sunset-sunrise.webp",
          "name": {
            "pt-BR": "Sede de Sangue",
            "en": "Bloodlust"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Técnica mecânica com recarga \"Em qualquer descanso\": o Safe Rest permanece aceso junto (nunca some). Testa a recarga em qualquer descanso e a regra do Safe Rest continuar aceso.</p>",
              "en": "<p>Mechanical technique set to \"On any Rest\": Safe Rest stays lit alongside it (it is never hidden). Tests any-rest recharge and the Safe-Rest-stays-lit rule.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "techniqueType": "mechanical",
            "focus": {
              "traitId": "",
              "traitName": "",
              "scale": 2
            },
            "recharges": {
              "session": false,
              "safeRest": true,
              "unsafeRest": true
            },
            "uses": {
              "value": 1,
              "max": 1
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Espetáculo Sangrento",
            "en": "Bloody Spectacle"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Korga não luta apenas para vencer, ela luta para a multidão rugir. Cada golpe vira um número de circo, cada esquiva arrancada na última fração de segundo. Quanto mais perigosa a manobra, mais a arena delira.</p>",
              "en": "<p>Korga doesn't just fight to win, she fights to make the crowd roar. Every blow becomes a circus act, every dodge ripped away at the last possible heartbeat. The more reckless the move, the louder the arena howls.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Provocar Plateia",
                "en": "Work the Crowd"
              },
              {
                "pt-BR": "Acrobacia Temerária",
                "en": "Daredevil Acrobatics"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Exibida",
                "en": "Showboat"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Provocar Plateia",
            "en": "Work the Crowd"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Manobras espalhafatosas que galvanizam o público e desmoralizam o oponente.</p>",
              "en": "<p>Flashy maneuvers that rally the crowd and rattle the opponent.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Acrobacia Temerária",
            "en": "Daredevil Acrobatics"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Saltos, giros e fintas arriscadas que transformam a defesa em show.</p>",
              "en": "<p>Leaps, spins, and risky feints that turn defense into showmanship.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Exibida",
            "en": "Showboat"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Não resiste a brincar com a vitória, baixando a guarda só para arrancar aplausos.</p>",
              "en": "<p>Can't resist toying with a win, dropping her guard just to earn applause.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "pip-o-novato",
      "type": "character",
      "img": "icons/environment/people/commoner.webp",
      "tokenImg": "icons/environment/people/commoner.webp",
      "name": {
        "pt-BR": "Pip, o Novato",
        "en": "Pip the Novice"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Recruta mínimo válido: 3 cores + 1 foco, sem técnicas, Escala 1. Baseline limpo de criação de personagem.</p>",
          "en": "<p>Minimal valid recruit: 3 cores + 1 focus, no techniques, Scale 1. A clean character-creation baseline.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Camponês recém-chegado à aventura",
          "en": "Peasant newly arrived to adventure"
        },
        "pronouns": {
          "pt-BR": "ele/dele",
          "en": "he/him"
        },
        "xp": {
          "value": 0,
          "session": 0
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Corpo",
            "en": "Body"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Corpo d6 de criação inicial.</p>",
              "en": "<p>Body Core d6 from initial creation.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-blue.webp",
          "name": {
            "pt-BR": "Mente",
            "en": "Mind"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Mente d8 de criação inicial.</p>",
              "en": "<p>Mind Core d8 from initial creation.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
          "name": {
            "pt-BR": "Alma",
            "en": "Soul"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core de Alma d10 de criação inicial.</p>",
              "en": "<p>Soul Core d10 from initial creation.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/nature/beam-hand-leaves-green.webp",
          "name": {
            "pt-BR": "Mãos de Fazendeiro",
            "en": "Farmer's Hands"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Único foco d8, simples e sem keywords. Baseline mínimo de foco.</p>",
              "en": "<p>A single Focus d8, simple and without keywords. A minimal Focus baseline.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/fire/beam-jet-stream-blue.webp",
          "name": {
            "pt-BR": "Sorte de Principiante",
            "en": "Beginner's Luck"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Pip não sabe o que está fazendo, mas de algum jeito dá certo. Quando todos esperam o fracasso, ele tropeça na resposta certa com um sorriso bobo no rosto.</p>",
              "en": "<p>Pip has no idea what he's doing, yet somehow it works out. Just when everyone expects him to fail, he stumbles onto the right answer with a daft grin.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "focus",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Improviso",
                "en": "Improvise"
              },
              {
                "pt-BR": "Coragem Ingênua",
                "en": "Naive Nerve"
              }
            ],
            "drawbacks": [
              {
                "pt-BR": "Inexperiente",
                "en": "Greenhorn"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Improviso",
            "en": "Improvise"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Resolver um problema com o que estiver à mão, sem treino nem plano.</p>",
              "en": "<p>Solving a problem with whatever's on hand, no training and no plan.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Coragem Ingênua",
            "en": "Naive Nerve"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Encarar o perigo por não entender direito o quão perigoso ele é.</p>",
              "en": "<p>Facing danger simply because he doesn't quite grasp how dangerous it is.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Inexperiente",
            "en": "Greenhorn"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Desconhece costumes, perigos e regras básicas da vida de aventureiro, e costuma errar o óbvio.</p>",
              "en": "<p>He's ignorant of the customs, hazards, and basic rules of the adventuring life, and often misses the obvious.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Trouxa de Viajante",
            "en": "Traveler's Bundle"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Tudo o que um camponês conseguiu enfiar num pano amarrado antes de sair pela estrada: o essencial para sobreviver à primeira jornada longe de casa.</p>",
              "en": "<p>Everything a peasant could knot into a cloth before hitting the road: the bare essentials for surviving a first journey away from home.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "pack",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": false,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": {
              "pt-BR": "Cobertor de lã, pão e queijo embrulhados, cantil, faca de mato, pederneira, corda curta",
              "en": "Wool blanket, wrapped bread and cheese, waterskin, whittling knife, flint and steel, short length of rope"
            },
            "keywords": [],
            "drawbacks": []
          }
        }
      ]
    },
    {
      "id": "capanga-de-beco",
      "type": "adversary",
      "img": "icons/creatures/abilities/wolf-howl-moon-white.webp",
      "tokenImg": "icons/creatures/abilities/wolf-howl-moon-white.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Capanga de Beco",
        "en": "Alley Thug"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Adversário mais simples possível (Poder 1): só Atitude + 1 traço ofensivo. Testa a base da matemática — defeat.max esperado = 1, ações/rodada = 1, orçamento de traços = 3.</p>",
          "en": "<p>The simplest possible adversary (Power 1): just an Attitude + 1 offensive trait. Tests the math baseline — expected defeat.max = 1, actions/round = 1, trait budget = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 1,
        "concept": {
          "pt-BR": "Bandido covarde que ataca em becos escuros",
          "en": "Cowardly bandit who strikes in dark alleys"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Hostil",
            "en": "Hostile"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única do Capanga (dado baixo d4). Único traço tipo-Core do adversário.</p>",
              "en": "<p>The Thug's sole Attitude (low d4). The adversary's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d4",
            "currentDie": "d4",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Faca Enferrujada",
            "en": "Rusty Knife"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (categoria adversary). Usa drawbacks, não keywords. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary category). Uses drawbacks, not keywords. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Lâmina cega",
                "en": "Dull blade"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Lâmina cega",
            "en": "Dull blade"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Dá pra ouvir o golpe chegando.</p>",
              "en": "<p>You can hear the strike coming.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/abilities/wolf-howl-moon-white.webp",
          "name": {
            "pt-BR": "Bote das Sombras",
            "en": "Lunge from the Shadows"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Escondido na penumbra de um beco, o capanga salta sobre quem passa e crava a faca antes que a vítima perceba de onde veio o golpe.</p>",
              "en": "<p>Lurking in an alley's gloom, the thug springs upon a passerby and sinks his blade before the victim ever sees where the blow came from.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Covarde",
                "en": "Coward"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Covarde",
            "en": "Coward"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Exposto à luz aberta ou encarado de frente, perde a coragem e recua em vez de atacar.</p>",
              "en": "<p>Dragged into open light or faced head-on, his nerve fails and he shrinks back instead of striking.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "guarda-blindado",
      "type": "adversary",
      "img": "icons/environment/people/infantry-armored.webp",
      "tokenImg": "icons/environment/people/infantry-armored.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Guarda Blindado",
        "en": "Armored Guard"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Poder 2 com traço especial BLINDADO (extraRequired 1). Testa defeat.max = poder+1 = 3. Ações/rodada = 2 (Blindado não dá ação extra). Orçamento de traços não-especiais = 4.</p>",
          "en": "<p>Power 2 with the special trait ARMORED (extraRequired 1). Tests defeat.max = power+1 = 3. Actions/round = 2 (Armored grants no extra action). Non-special trait budget = 4.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 2,
        "concept": {
          "pt-BR": "Sentinela couraçado que protege o portão",
          "en": "Iron-clad sentinel who guards the gate"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Disciplinado",
            "en": "Disciplined"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única (d6 baixo). Único traço tipo-Core do Guarda.</p>",
              "en": "<p>The Guard's sole Attitude (low d6). The Guard's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Alabarda",
            "en": "Halberd"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary). Usa drawbacks. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary). Uses drawbacks. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Arma pesada",
                "en": "Heavy weapon"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/beam-impact-purple.webp",
          "name": {
            "pt-BR": "Arma pesada",
            "en": "Heavy weapon"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Lenta para reposicionar.</p>",
              "en": "<p>Slow to reposition.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Blindado",
            "en": "Armored"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço especial BLINDADO: exige 1 derrota extra (extraRequired 1). Não bloqueia, não dá ação. Eleva defeat.max para 3.</p>",
              "en": "<p>Special trait ARMORED: requires 1 extra defeat (extraRequired 1). Doesn't block, grants no action. Raises defeat.max to 3.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 1,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/infantry-armored.webp",
          "name": {
            "pt-BR": "Muralha de Escudo",
            "en": "Shield Wall"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O guarda crava os pés diante do portão e ergue o escudo como uma parede de aço. Enquanto ele se mantém firme, ninguém passa sem antes derrubá-lo.</p>",
              "en": "<p>The guard plants his feet before the gate and raises his shield like a wall of steel. While he holds his ground, none may pass without first bringing him down.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Enraizado",
                "en": "Rooted"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Enraizado",
            "en": "Rooted"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Defender o portão o prende ao lugar; ele não consegue perseguir quem recua ou contorna sua posição.</p>",
              "en": "<p>Holding the gate roots him in place; he cannot pursue anyone who retreats or slips around his position.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/infantry-armored.webp",
          "name": {
            "pt-BR": "Estocada de Alcance",
            "en": "Reaching Lunge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Aproveitando o longo cabo da alabarda, o guarda avança a lâmina para enganchar um inimigo que tenta passar e prendê-lo no lugar contra os portões.</p>",
              "en": "<p>Using the halberd's long haft, the guard thrusts the blade out to hook an enemy slipping past and pin them in place against the gates.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Desajeitado",
                "en": "Unwieldy"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Desajeitado",
            "en": "Unwieldy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A arma longa é lenta de recolher; um adversário ágil que feche a distância o pega exposto.</p>",
              "en": "<p>The long weapon is slow to recover; a nimble foe who closes the gap catches him exposed.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "golem-de-pedra",
      "type": "adversary",
      "img": "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
      "tokenImg": "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Golem de Pedra",
        "en": "Stone Golem"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Poder 3 com FORTEMENTE BLINDADO (extraRequired 2, mustBeExhaustedFirst true). Testa o bloqueador: precisa exaurir a couraça antes de qualquer derrota contar. defeat.max = poder+2 = 5. Ações = 3.</p>",
          "en": "<p>Power 3 with HEAVILY ARMORED (extraRequired 2, mustBeExhaustedFirst true). Tests the blocker: the armor must be exhausted before any defeat counts. defeat.max = power+2 = 5. Actions = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 3,
        "concept": {
          "pt-BR": "Construto rúnico quase indestrutível",
          "en": "Nearly indestructible rune-bound construct"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Implacável",
            "en": "Relentless"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única (d6 baixo). Único traço tipo-Core do Golem.</p>",
              "en": "<p>The Golem's sole Attitude (low d6). The Golem's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Punho Esmagador",
            "en": "Crushing Fist"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary). Usa drawbacks. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary). Uses drawbacks. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Movimento lento",
                "en": "Slow movement"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/beam-impact-purple.webp",
          "name": {
            "pt-BR": "Movimento lento",
            "en": "Slow movement"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Dá pra ler o telegrafar do golpe.</p>",
              "en": "<p>You can read the blow being telegraphed.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Pisão Rúnico",
            "en": "Runic Stomp"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Segundo traço ofensivo (adversary) dentro do orçamento Poder+2 = 5. Usa drawbacks.</p>",
              "en": "<p>Second offensive trait (adversary) within the Power+2 = 5 budget. Uses drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Alcance curto",
                "en": "Short reach"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Alcance curto",
            "en": "Short reach"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Só atinge inimigos próximos, em alcance corpo a corpo.</p>",
              "en": "<p>Only strikes nearby foes, at melee range.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-stone-skin.webp",
          "name": {
            "pt-BR": "Fortemente Blindado",
            "en": "Heavily Armored"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço especial FORTEMENTE BLINDADO: extraRequired 2 e mustBeExhaustedFirst true. Bloqueia todas as derrotas até ser exaurido. Aparece em blockedBy enquanto não exausto.</p>",
              "en": "<p>Special trait HEAVILY ARMORED: extraRequired 2 and mustBeExhaustedFirst true. Blocks all defeats until it is exhausted. Appears in blockedBy while not exhausted.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 2,
              "mustBeExhaustedFirst": true
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
          "name": {
            "pt-BR": "Carga Demolidora",
            "en": "Demolishing Charge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O golem arremessa toneladas de pedra para frente, atravessando paredes, móveis e qualquer um tolo o bastante para ficar no caminho. O impacto derruba e atordoa quem sobrevive ao primeiro choque.</p>",
              "en": "<p>The golem hurls tons of stone forward, smashing through walls, furniture, and anyone foolish enough to stand in its path. The impact knocks down and stuns whoever survives the first blow.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Sem Freio",
                "en": "No Brakes"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Sem Freio",
            "en": "No Brakes"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Uma vez em movimento ele não consegue parar nem virar, e fica exposto se errar o alvo.</p>",
              "en": "<p>Once moving it cannot stop or turn, and is left exposed if it misses its target.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
          "name": {
            "pt-BR": "Runas Reconstituintes",
            "en": "Mending Runes"
          },
          "system": {
            "description": {
              "pt-BR": "<p>As runas gravadas no corpo do golem brilham e selam rachaduras e lascas, fechando feridas que abateriam qualquer criatura de carne. Enquanto as runas pulsarem, a pedra se refaz sozinha.</p>",
              "en": "<p>The runes carved across the golem's body flare and seal cracks and chips, knitting shut wounds that would fell any creature of flesh. So long as the runes pulse, the stone remakes itself.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Runa Mestra",
                "en": "Master Rune"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Runa Mestra",
            "en": "Master Rune"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Apagar ou quebrar a runa central em sua testa interrompe toda a regeneração.</p>",
              "en": "<p>Defacing or shattering the central rune on its brow halts all regeneration.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "matilha-de-lobos",
      "type": "adversary",
      "img": "icons/creatures/abilities/wolf-howl-moon-purple.webp",
      "tokenImg": "icons/creatures/abilities/wolf-howl-moon-purple.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Matilha de Lobos",
        "en": "Wolf Pack"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Poder 2 com GRUPO PEQUENO (extraRequired 1, extraActions 1). Testa ações/rodada = poder+1 = 3, e defeat.max = poder+1 = 3.</p>",
          "en": "<p>Power 2 with SMALL GROUP (extraRequired 1, extraActions 1). Tests actions/round = power+1 = 3, and defeat.max = power+1 = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 2,
        "concept": {
          "pt-BR": "Pequeno bando de lobos famintos que cerca a presa",
          "en": "Small band of starving wolves that surrounds its prey"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Faminto",
            "en": "Starving"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única (d4 baixo). Único traço tipo-Core da Matilha.</p>",
              "en": "<p>The Pack's sole Attitude (low d4). The Pack's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d4",
            "currentDie": "d4",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Dentadas Coordenadas",
            "en": "Coordinated Bites"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary). Usa drawbacks. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary). Uses drawbacks. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Dispersa fácil",
                "en": "Easily scattered"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Dispersa fácil",
            "en": "Easily scattered"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Ruído alto e fogo afugentam o bando.</p>",
              "en": "<p>Loud noise and fire drive the pack off.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Grupo Pequeno",
            "en": "Small Group"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço especial GRUPO PEQUENO: extraRequired 1 e extraActions 1. Dá uma ação extra (ações = poder+1) e uma derrota extra (defeat.max = poder+1).</p>",
              "en": "<p>Special trait SMALL GROUP: extraRequired 1 and extraActions 1. Grants one extra action (actions = power+1) and one extra defeat (defeat.max = power+1).</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 1,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 1
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/abilities/wolf-howl-moon-purple.webp",
          "name": {
            "pt-BR": "Cerco Implacável",
            "en": "Relentless Encircle"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Os lobos se espalham e cercam a presa por todos os lados, cortando rotas de fuga e fechando o laço pouco a pouco. Quem tenta correr só encontra outra fileira de dentes.</p>",
              "en": "<p>The wolves fan out and ring their prey on every side, cutting off escape routes and drawing the noose tighter with each pass. Whoever bolts only finds another row of teeth.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Disperso",
                "en": "Scattered"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Disperso",
            "en": "Scattered"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Se a formação é rompida, os lobos se espalham em pânico e perdem o cerco.</p>",
              "en": "<p>If their formation is broken, the wolves scatter in a panic and lose the encirclement.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/abilities/wolf-howl-moon-purple.webp",
          "name": {
            "pt-BR": "Faro de Sangue",
            "en": "Bloodscent"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O cheiro de sangue enlouquece a matilha, que persegue a presa ferida sem cansar, por quilômetros, até derrubá-la pela exaustão.</p>",
              "en": "<p>The reek of blood drives the pack wild, and they hound a wounded quarry tirelessly for miles, running it down until it drops from exhaustion.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Distraível",
                "en": "Distractible"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Distraível",
            "en": "Distractible"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Um odor mais forte, como carne fresca, desvia a matilha do alvo.</p>",
              "en": "<p>A stronger scent, such as fresh meat, lures the pack away from its target.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "horda-de-goblins",
      "type": "adversary",
      "img": "icons/creatures/unholy/demon-fire-horned-winged-roar.webp",
      "tokenImg": "icons/creatures/unholy/demon-fire-horned-winged-roar.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Horda de Goblins",
        "en": "Goblin Horde"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Poder 3 com GRUPO GRANDE (extraRequired 2, extraActions 2). Testa ações/rodada = poder+2 = 5, e defeat.max = poder+2 = 5.</p>",
          "en": "<p>Power 3 with LARGE GROUP (extraRequired 2, extraActions 2). Tests actions/round = power+2 = 5, and defeat.max = power+2 = 5.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 3,
        "concept": {
          "pt-BR": "Multidão barulhenta de goblins que ataca em ondas",
          "en": "Noisy mob of goblins that attacks in waves"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Selvagem",
            "en": "Savage"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única (d6 baixo). Único traço tipo-Core da Horda.</p>",
              "en": "<p>The Horde's sole Attitude (low d6). The Horde's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Enxame de Lanças",
            "en": "Swarm of Spears"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary). Usa drawbacks. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary). Uses drawbacks. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Indisciplinada",
                "en": "Undisciplined"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Indisciplinada",
            "en": "Undisciplined"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Perde a coragem se o líder cai.</p>",
              "en": "<p>Loses its nerve if the leader falls.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Grupo Grande",
            "en": "Large Group"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço especial GRUPO GRANDE: extraRequired 2 e extraActions 2. Dá duas ações extras (ações = poder+2) e duas derrotas extras (defeat.max = poder+2).</p>",
              "en": "<p>Special trait LARGE GROUP: extraRequired 2 and extraActions 2. Grants two extra actions (actions = power+2) and two extra defeats (defeat.max = power+2).</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 2,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 2
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/unholy/demon-fire-horned-winged-roar.webp",
          "name": {
            "pt-BR": "Maré de Corpos",
            "en": "Tide of Bodies"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Goblins se jogam aos montes sobre o alvo, soterrando-o sob garras, dentes e peso puro. Quanto mais caem, mais chegam para tomar seu lugar.</p>",
              "en": "<p>Goblins fling themselves in heaps onto a target, burying it under claws, teeth, and sheer weight. The more that fall, the more swarm in to take their place.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Desorganizada",
                "en": "Disorganized"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Desorganizada",
            "en": "Disorganized"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A horda atropela a si mesma e não consegue se concentrar em mais de um alvo por vez.</p>",
              "en": "<p>The horde trips over itself and cannot focus on more than one target at a time.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/unholy/demon-fire-horned-winged-roar.webp",
          "name": {
            "pt-BR": "Gritaria Ensurdecedora",
            "en": "Deafening Screeching"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A multidão urra, bate em escudos e guincha em uníssono, um estardalhaço que abala os nervos e abafa qualquer ordem gritada no campo de batalha.</p>",
              "en": "<p>The mob howls, bangs on shields, and shrieks as one, a din that rattles nerves and drowns out any command shouted across the battlefield.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Barulhenta",
                "en": "Noisy"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Barulhenta",
            "en": "Noisy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O alarido entrega a posição da horda muito antes de ela aparecer, tornando emboscadas impossíveis.</p>",
              "en": "<p>The racket gives away the horde's position long before it arrives, making ambushes impossible.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/unholy/demon-fire-horned-winged-roar.webp",
          "name": {
            "pt-BR": "Pilhagem Frenética",
            "en": "Frenzied Looting"
          },
          "system": {
            "description": {
              "pt-BR": "<p>No meio da luta, mãos sujas agarram tudo que brilha: armas, bolsas e itens largados são arrancados do inimigo antes que ele perceba.</p>",
              "en": "<p>Mid-fight, grubby hands grab anything that glints: weapons, pouches, and dropped gear are snatched off a foe before they even notice.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Gananciosa",
                "en": "Greedy"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Gananciosa",
            "en": "Greedy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Diante de um tesouro vistoso, os goblins largam a briga e brigam entre si pelo saque.</p>",
              "en": "<p>Faced with shiny treasure, the goblins abandon the fight and squabble among themselves over the loot.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "dragao-anciao",
      "type": "adversary",
      "img": "icons/creatures/abilities/dragon-fire-breath-orange.webp",
      "tokenImg": "icons/creatures/abilities/dragon-fire-breath-orange.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Dragão Ancião",
        "en": "Ancient Dragon"
      },
      "system": {
        "description": {
          "pt-BR": "<p>CHEFE em Escala 2, Poder 4: Atitude + 3 traços ofensivos (orçamento Poder+2 = 6 não-especiais) + 1 especial Blindado + um traço ofensivo com override de Escala PARA CIMA (scale.custom true, value 2). Testa defeat.max = poder+1 = 5, ações = 4 e override de Escala.</p>",
          "en": "<p>BOSS at Scale 2, Power 4: Attitude + 3 offensive traits (Power+2 = 6 non-special budget) + 1 special Armored + one offensive trait with a Scale UP override (scale.custom true, value 2). Tests defeat.max = power+1 = 5, actions = 4, and the Scale override.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 2,
        "power": 4,
        "concept": {
          "pt-BR": "Wyrm milenar que reina sobre o pico vulcânico",
          "en": "Millennia-old wyrm that reigns over the volcanic peak"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Arrogante",
            "en": "Arrogant"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude única (d6 baixo). Único traço tipo-Core do Dragão.</p>",
              "en": "<p>The Dragon's sole Attitude (low d6). The Dragon's only Core-type trait.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Garras Dilacerantes",
            "en": "Rending Claws"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary) na Escala do dono (2). Usa drawbacks. Conta para o limite de traços.</p>",
              "en": "<p>Offensive trait (adversary) at the owner's Scale (2). Uses drawbacks. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Vulnerável por baixo",
                "en": "Vulnerable from below"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/beam-impact-purple.webp",
          "name": {
            "pt-BR": "Vulnerável por baixo",
            "en": "Vulnerable from below"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Barriga macia exposta no ar.</p>",
              "en": "<p>Soft belly exposed in the air.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Cauda Esmagadora",
            "en": "Crushing Tail"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Segundo traço ofensivo (adversary) na Escala do dono (2). Usa drawbacks.</p>",
              "en": "<p>Second offensive trait (adversary) at the owner's Scale (2). Uses drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Telegrafada",
                "en": "Telegraphed"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Telegrafada",
            "en": "Telegraphed"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O giro da cauda é amplo e previsível.</p>",
              "en": "<p>The tail's swing is wide and predictable.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/control/fear-fright-monster-green.webp",
          "name": {
            "pt-BR": "Sopro Incandescente",
            "en": "Incandescent Breath"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço ofensivo (adversary) com OVERRIDE de Escala PARA CIMA: scale.custom true, value 2 — testa a resolução de Escala do traço sobre a do dono. Usa drawbacks.</p>",
              "en": "<p>Offensive trait (adversary) with a Scale UP override: scale.custom true, value 2 — tests the trait's Scale resolution over the owner's. Uses drawbacks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": true,
              "value": 2
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Recarga lenta",
                "en": "Slow recharge"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/unholy/barrier-fire-pink.webp",
          "name": {
            "pt-BR": "Recarga lenta",
            "en": "Slow recharge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Precisa respirar fundo entre as baforadas.</p>",
              "en": "<p>Needs to draw a deep breath between blasts.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Escamas de Adamante",
            "en": "Adamantine Scales"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço especial BLINDADO: extraRequired 1, sem ação extra, não bloqueia. Eleva defeat.max para poder+1 = 5.</p>",
              "en": "<p>Special trait ARMORED: extraRequired 1, no extra action, doesn't block. Raises defeat.max to power+1 = 5.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 1,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/abilities/dragon-fire-breath-orange.webp",
          "name": {
            "pt-BR": "Voo Rasante Devastador",
            "en": "Devastating Dive"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Erguendo-se acima das nuvens de cinza, o wyrm dobra as asas e despenca como uma avalanche de músculos e fogo. O impacto rompe armaduras e atira inimigos por sobre as rochas fumegantes.</p>",
              "en": "<p>Rising above the ash clouds, the wyrm folds its wings and plummets like an avalanche of muscle and flame. The impact shatters armor and hurls foes across the smoking rocks.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Mergulho Comprometido",
                "en": "Committed Plunge"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Mergulho Comprometido",
            "en": "Committed Plunge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Após o mergulho, fica em solo aberto e descoberto por um instante, vulnerável a contra-ataques.</p>",
              "en": "<p>After the dive it lands in the open, exposed and off-balance for a moment, leaving it open to counterattack.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/abilities/dragon-fire-breath-orange.webp",
          "name": {
            "pt-BR": "Presença Aterradora",
            "en": "Terrifying Presence"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O olhar fundo e antigo do dragão pesa como uma sentença. Sua mera presença sufoca a coragem, fazendo até heróis veteranos hesitarem e tremerem diante do soberano do vulcão.</p>",
              "en": "<p>The dragon's deep, ancient gaze lands like a verdict. Its very presence smothers courage, making even seasoned heroes falter and tremble before the volcano's sovereign.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Orgulho Ferido",
                "en": "Wounded Pride"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Orgulho Ferido",
            "en": "Wounded Pride"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Quem o desafia abertamente sem recuar perfura sua arrogância, anulando o terror que impõe.</p>",
              "en": "<p>Anyone who openly defies it without flinching pierces its arrogance, nullifying the terror it projects.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "galeao-estrela-do-mar",
      "type": "vehicle",
      "img": "icons/environment/vehicles/boat-fishing-masted.webp",
      "tokenImg": "icons/environment/vehicles/boat-fishing-masted.webp",
      "name": {
        "pt-BR": "Galeão Estrela-do-Mar",
        "en": "Starfish Galleon"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Galeão de velas para testar veículo com Estrutura e Manobrabilidade (cores travados) e um traço de Carga. Arraste tripulantes para a aba de tripulação após importar.</p>",
          "en": "<p>Sailing galleon to test a vehicle with Structure and Maneuverability (locked cores) and a Cargo trait. Drag crew members onto the crew tab after importing.</p>"
        },
        "source": {
          "pt-BR": "Mundo de Teste",
          "en": "Test Fixtures"
        },
        "scale": 3,
        "concept": {
          "pt-BR": "Navio mercante de três mastros",
          "en": "Three-masted merchant ship"
        },
        "crew": []
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Estrutura",
            "en": "Structure"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado para testar o casco do veículo resistindo a danos.</p>",
              "en": "<p>Locked core to test the vehicle's hull resisting damage.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/bows/bow-recurve-black.webp",
          "name": {
            "pt-BR": "Manobrabilidade",
            "en": "Maneuverability"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado para testar manobras e fuga do veículo no mar aberto.</p>",
              "en": "<p>Locked core to test the vehicle's maneuvering and escape on the open sea.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/commodities/cloth/cloth-bolt-gold.webp",
          "name": {
            "pt-BR": "Carga",
            "en": "Cargo"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Carga para testar suprimentos gastos em Descansos Inseguros a bordo.</p>",
              "en": "<p>Cargo trait to test supplies spent on Risky Rests aboard ship.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "cargo",
            "maxDie": "d6",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": false,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        }
      ]
    },
    {
      "id": "locomotiva-blindada-ferro-negro",
      "type": "vehicle",
      "img": "icons/environment/vehicles/locomotive-train-engine.webp",
      "tokenImg": "icons/environment/vehicles/locomotive-train-engine.webp",
      "name": {
        "pt-BR": "Locomotiva Blindada Ferro-Negro",
        "en": "Blackiron Armored Locomotive"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Locomotiva blindada para testar veículo com escala alta, Estrutura e Manobrabilidade (cores travados) e Carga. Arraste tripulantes para a aba de tripulação após importar.</p>",
          "en": "<p>Armored locomotive to test a vehicle with high scale, Structure and Maneuverability (locked cores), and Cargo. Drag crew members onto the crew tab after importing.</p>"
        },
        "source": {
          "pt-BR": "Mundo de Teste",
          "en": "Test Fixtures"
        },
        "scale": 4,
        "concept": {
          "pt-BR": "Trem de guerra a vapor",
          "en": "Steam-powered war train"
        },
        "crew": []
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
          "name": {
            "pt-BR": "Estrutura",
            "en": "Structure"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado de chassi reforçado para testar a resistência blindada do trem.</p>",
              "en": "<p>Locked reinforced-chassis core to test the train's armored toughness.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d4",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/weapons/bows/bow-recurve-black.webp",
          "name": {
            "pt-BR": "Manobrabilidade",
            "en": "Maneuverability"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado para testar a baixa agilidade de um trem preso aos trilhos.</p>",
              "en": "<p>Locked core to test the low agility of a train bound to its rails.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d12",
            "currentDie": "d12",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/commodities/cloth/cloth-bolt-gold.webp",
          "name": {
            "pt-BR": "Carga",
            "en": "Cargo"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço de Carga exausto para testar a tela de suprimentos esgotados (exhausted com currentDie d12).</p>",
              "en": "<p>Exhausted Cargo trait to test the depleted-supplies display (exhausted with currentDie d12).</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "cargo",
            "maxDie": "d8",
            "currentDie": "d12",
            "exhausted": true,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": false,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        }
      ]
    },
    {
      "id": "vilarejo-de-pedravale",
      "type": "location",
      "img": "icons/environment/settlement/house-farmland.webp",
      "tokenImg": "icons/environment/settlement/house-farmland.webp",
      "name": {
        "pt-BR": "Vilarejo de Pedravale",
        "en": "Stonevale Village"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Vila de fronteira para testar local com Atitude, Riqueza e Segurança (cores travados, autoShift desligado) e Marcos embutidos seguros e inseguros. Adicione NPCs após importar.</p>",
          "en": "<p>Frontier village to test a location with Attitude, Wealth, and Security (locked cores, autoShift off) and embedded safe and unsafe Landmarks. Add NPCs after importing.</p>"
        },
        "source": {
          "pt-BR": "Mundo de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "concept": {
          "pt-BR": "Povoado agrícola na fronteira",
          "en": "Agricultural settlement on the frontier"
        },
        "landmarks": [],
        "npcs": []
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Hospitalidade Cautelosa",
            "en": "Wary Hospitality"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude do local (autoShift desligado) para testar como a vila recebe forasteiros.</p>",
              "en": "<p>The location's Attitude (autoShift off) to test how the village receives outsiders.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Acolhedor",
                "en": "Welcoming"
              },
              {
                "pt-BR": "Desconfiado",
                "en": "Suspicious"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Acolhedor",
            "en": "Welcoming"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Palavra-chave de hover da Atitude para testar o pop-up de keyword no local.</p>",
              "en": "<p>Attitude hover keyword to test the keyword pop-up on the location.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Desconfiado",
            "en": "Suspicious"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Palavra-chave que tempera a hospitalidade da vila com cautela.</p>",
              "en": "<p>Keyword that tempers the village's hospitality with caution.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Riqueza",
            "en": "Wealth"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado (autoShift desligado) para testar a prosperidade modesta do vilarejo.</p>",
              "en": "<p>Locked core (autoShift off) to test the village's modest prosperity.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Segurança",
            "en": "Security"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado (autoShift desligado) para testar a defesa da vila contra ameaças da fronteira.</p>",
              "en": "<p>Locked core (autoShift off) to test the village's defense against frontier threats.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d8",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/settlement/blacksmith.webp",
          "name": {
            "pt-BR": "Ferraria do Bardo",
            "en": "Bard's Smithy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Marco seguro para testar Descansos Seguros no vilarejo.</p>",
              "en": "<p>Safe landmark to test Safe Rests in the village.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": true
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/settlement/church.webp",
          "name": {
            "pt-BR": "Capela da Aurora",
            "en": "Chapel of the Dawn"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Segundo marco seguro para testar múltiplos pontos de descanso no local.</p>",
              "en": "<p>Second safe landmark to test multiple resting points in the location.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": true
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/wilderness/cave-entrance-mountain.webp",
          "name": {
            "pt-BR": "Mina Abandonada da Colina",
            "en": "Abandoned Hillside Mine"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Marco inseguro para testar Descansos Inseguros e perigo próximo à vila.</p>",
              "en": "<p>Unsafe landmark to test Risky Rests and danger near the village.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": false
          }
        }
      ]
    },
    {
      "id": "charneca-dos-lamentos",
      "type": "location",
      "img": "icons/environment/wilderness/cave-entrance-mountain.webp",
      "tokenImg": "icons/environment/wilderness/cave-entrance-mountain.webp",
      "name": {
        "pt-BR": "Charneca dos Lamentos",
        "en": "Moor of Laments"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Ermo assombrado para testar local selvagem com Atitude hostil, Riqueza e Segurança baixas (cores travados, autoShift desligado) e Marcos embutidos. Adicione NPCs após importar.</p>",
          "en": "<p>Haunted wasteland to test a wilderness location with hostile Attitude, low Wealth and Security (locked cores, autoShift off), and embedded Landmarks. Add NPCs after importing.</p>"
        },
        "source": {
          "pt-BR": "Mundo de Teste",
          "en": "Test Fixtures"
        },
        "scale": 2,
        "concept": {
          "pt-BR": "Pântano amaldiçoado e abandonado",
          "en": "Cursed and abandoned marshland"
        },
        "landmarks": [],
        "npcs": []
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Fome Espectral",
            "en": "Spectral Hunger"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude hostil do ermo (autoShift desligado) para testar uma região que ataca quem entra.</p>",
              "en": "<p>The wasteland's hostile Attitude (autoShift off) to test a region that attacks any who enter.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Assombrado",
                "en": "Haunted"
              },
              {
                "pt-BR": "Faminto",
                "en": "Hungering"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Assombrado",
            "en": "Haunted"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Palavra-chave de hover da Atitude para testar o clima fantasmagórico da charneca.</p>",
              "en": "<p>Attitude hover keyword to test the ghostly atmosphere of the moor.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Faminto",
            "en": "Hungering"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Palavra-chave que retrata o ermo devorando viajantes incautos.</p>",
              "en": "<p>Keyword that portrays the wasteland devouring unwary travelers.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/containers/bags/coinpouch-leather-orange.webp",
          "name": {
            "pt-BR": "Riqueza",
            "en": "Wealth"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado (autoShift desligado) com dado fraco para testar uma região empobrecida.</p>",
              "en": "<p>Locked core (autoShift off) with a weak die to test an impoverished region.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d12",
            "currentDie": "d12",
            "exhausted": false,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
          "name": {
            "pt-BR": "Segurança",
            "en": "Security"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Core travado e exausto (autoShift desligado, exhausted com currentDie d12) para testar um local totalmente inseguro.</p>",
              "en": "<p>Locked and exhausted core (autoShift off, exhausted with currentDie d12) to test a fully unsafe location.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "category": "core",
            "maxDie": "d10",
            "currentDie": "d12",
            "exhausted": true,
            "temporary": false,
            "locked": true,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": false,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/settlement/church.webp",
          "name": {
            "pt-BR": "Ruína da Capela Submersa",
            "en": "Ruin of the Sunken Chapel"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Marco seguro raro no ermo para testar um refúgio isolado em meio ao perigo.</p>",
              "en": "<p>A rare safe landmark in the wasteland, to test an isolated refuge amid the danger.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": true
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/settlement/graveyard.webp",
          "name": {
            "pt-BR": "Cemitério Afundado",
            "en": "Sunken Graveyard"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Marco inseguro para testar Descansos Inseguros entre os mortos da charneca.</p>",
              "en": "<p>Unsafe landmark to test Risky Rests among the dead of the moor.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": false
          }
        },
        {
          "type": "landmark",
          "img": "icons/environment/wilderness/cave-entrance-mountain.webp",
          "name": {
            "pt-BR": "Toca da Névoa",
            "en": "Mist Burrow"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Segundo marco inseguro para testar múltiplos pontos perigosos no mesmo local.</p>",
              "en": "<p>Second unsafe landmark to test multiple dangerous points in the same location.</p>"
            },
            "source": {
              "pt-BR": "Mundo de Teste",
              "en": "Test Fixtures"
            },
            "safe": false
          }
        }
      ]
    },
    {
      "id": "companhia-da-aurora",
      "type": "party",
      "img": "icons/sundries/flags/banner-flag-pink.webp",
      "tokenImg": "icons/sundries/flags/banner-flag-pink.webp",
      "name": {
        "pt-BR": "Companhia da Aurora",
        "en": "Company of the Dawn"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Grupo da campanha para testar a ficha de party. O roster e o códex são preenchidos arrastando atores após importar; as missões e notas já vêm populadas.</p>",
          "en": "<p>Campaign group to test the party sheet. The roster and codex are filled by dragging actors after importing; the quests and notes come pre-populated.</p>"
        },
        "source": {
          "pt-BR": "Mundo de Teste",
          "en": "Test Fixtures"
        },
        "members": [],
        "codex": [],
        "quests": [
          {
            "name": {
              "pt-BR": "Investigar a Charneca dos Lamentos",
              "en": "Investigate the Moor of Laments"
            },
            "die": "d4",
            "exhausted": false,
            "outcome": "",
            "notes": {
              "pt-BR": "Missão recém-aberta (dado d4) para testar uma quest no estágio inicial. Algo arrasta viajantes para o pântano.",
              "en": "Newly opened quest (d4 die) to test a quest at its early stage. Something is dragging travelers into the marsh."
            },
            "links": []
          },
          {
            "name": {
              "pt-BR": "Reparar a Locomotiva Blindada",
              "en": "Repair the Armored Locomotive"
            },
            "die": "d8",
            "exhausted": false,
            "outcome": "",
            "notes": {
              "pt-BR": "Missão em andamento (dado d8) para testar uma quest no meio do progresso. Faltam peças e um maquinista de confiança.",
              "en": "Quest in progress (d8 die) to test a quest mid-progress. Parts and a trustworthy engineer are still missing."
            },
            "links": []
          },
          {
            "name": {
              "pt-BR": "Negociar trégua em Pedravale",
              "en": "Negotiate a truce in Stonevale"
            },
            "die": "d12",
            "exhausted": false,
            "outcome": "",
            "notes": {
              "pt-BR": "Missão quase concluída (dado d12, ainda não exausta) para testar o limite antes da resolução. Só falta o aperto de mãos final.",
              "en": "Quest nearly complete (d12 die, not yet exhausted) to test the threshold before resolution. Only the final handshake remains."
            },
            "links": []
          },
          {
            "name": {
              "pt-BR": "Escoltar o comboio mercante até o porto",
              "en": "Escort the merchant convoy to the port"
            },
            "die": "d12",
            "exhausted": true,
            "outcome": "done",
            "notes": {
              "pt-BR": "Missão resolvida com sucesso (exausta, outcome done) para testar a exibição de uma quest concluída.",
              "en": "Quest resolved successfully (exhausted, outcome done) to test the display of a completed quest."
            },
            "links": []
          },
          {
            "name": {
              "pt-BR": "Salvar a aldeia de Folha-Seca do incêndio",
              "en": "Save the village of Dryleaf from the fire"
            },
            "die": "d12",
            "exhausted": true,
            "outcome": "failed",
            "notes": {
              "pt-BR": "Missão resolvida em fracasso (exausta, outcome failed) para testar a exibição de uma quest perdida.",
              "en": "Quest resolved in failure (exhausted, outcome failed) to test the display of a lost quest."
            },
            "links": []
          }
        ],
        "notes": {
          "journal": {
            "pt-BR": "<p>A Companhia da Aurora se uniu para proteger as rotas da fronteira. Anotações livres de campanha para testar o campo de diário da party.</p>",
            "en": "<p>The Company of the Dawn banded together to protect the frontier routes. Free-form campaign notes to test the party's journal field.</p>"
          },
          "clues": {
            "pt-BR": "<p>Uma névoa fria sobe da Charneca dos Lamentos toda lua nova. Pistas para testar o campo de pistas da party.</p>",
            "en": "<p>A cold mist rises from the Moor of Laments every new moon. Clues to test the party's clues field.</p>"
          },
          "contacts": {
            "pt-BR": "<p>Ferreiro Bardo, em Pedravale, vende e conserta equipamento. Contatos para testar o campo de contatos da party.</p>",
            "en": "<p>Bard the Smith, in Stonevale, sells and repairs gear. Contacts to test the party's contacts field.</p>"
          }
        }
      },
      "items": []
    },
    {
      "id": "doran-o-mascate-errante",
      "type": "adversary",
      "img": "icons/commodities/currency/coin-embossed-crown-gold.webp",
      "tokenImg": "icons/environment/people/commoner.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Doran, o Mascate Errante",
        "en": "Doran the Wandering Peddler"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Mercador ambulante (Poder 1) que vende quinquilharias e compra o que os aventureiros saqueiam. Usa o bloco de Adversário só por conveniência — é amistoso e não hostil. Atitude + 1 traço útil; orçamento de traços = 3.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. A traveling merchant (Power 1) who sells trinkets and buys whatever the adventurers loot. Uses the Adversary stat block purely for convenience — he is friendly, not hostile. Attitude + 1 helpful trait; trait budget = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 1,
        "concept": {
          "pt-BR": "Comerciante itinerante que negocia em qualquer estrada",
          "en": "Itinerant trader who deals on any road"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Negociante",
            "en": "Dealmaker"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra do Mascate (d8). Único traço tipo-Core; rola para pechinchar e avaliar mercadorias. Carrega a keyword Pechincha.</p>",
              "en": "<p>The Peddler's neutral attitude (d8). His only Core-like trait; rolled to haggle and appraise wares. Carries the Haggle keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Pechincha",
                "en": "Haggle"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/commodities/treasure/brooch-gold-ruby.webp",
          "name": {
            "pt-BR": "Estoque Inesgotável",
            "en": "Bottomless Stock"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) do Mascate: a carroça sempre parece ter aquele item raro que a party precisa — por um preço. Conta para o limite de traços.</p>",
              "en": "<p>The Peddler's helpful trait (adversary category): his wagon always seems to have that one rare item the party needs — for a price. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Preço de amigo",
                "en": "Friend price"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/commodities/currency/coin-embossed-ruby-gold.webp",
          "name": {
            "pt-BR": "Pechincha",
            "en": "Haggle"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude do Mascate: ele sempre arranca um desconto ou um troco extra de qualquer negócio. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Peddler's attitude keyword: he always squeezes a discount or some change out of any deal. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Preço de amigo",
            "en": "Friend price"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Tudo custa um pouco mais do que deveria.</p>",
              "en": "<p>Everything costs a little more than it should.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/commodities/currency/coin-embossed-crown-gold.webp",
          "name": {
            "pt-BR": "Quinquilharia Improvável",
            "en": "Unlikely Trinket"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Doran enfia a mão numa mochila abarrotada e saca exatamente a bugiganga certa para a ocasião: um pó que cega, um apito que espanta feras, um amuleto que talvez funcione. Ninguém nunca sabe o que vai sair — nem ele.</p>",
              "en": "<p>Doran plunges a hand into an overstuffed satchel and produces exactly the right gewgaw for the moment: a fistful of blinding powder, a whistle that scatters beasts, a charm that just might work. Nobody ever knows what he'll pull out, least of all him.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Bugiganga Ordinária",
                "en": "Shoddy Goods"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Bugiganga Ordinária",
            "en": "Shoddy Goods"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Boa parte da mercadoria é tranqueira barata que falha na hora errada.</p>",
              "en": "<p>Much of his stock is cheap junk that fails at the worst moment.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "mae-wynna-a-curandeira-da-vila",
      "type": "adversary",
      "img": "icons/magic/holy/chalice-glowing-gold.webp",
      "tokenImg": "icons/environment/people/cleric-grey.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Mãe Wynna, a Curandeira da Vila",
        "en": "Mother Wynna, the Village Healer"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Curandeira da aldeia (Poder 1) que cuida dos feridos e prepara remédios. Bloco de Adversário usado só por conveniência — é amistosa. Atitude + 1 traço útil; orçamento de traços = 3.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. A village healer (Power 1) who tends the wounded and brews remedies. Adversary stat block used purely for convenience — she is friendly. Attitude + 1 helpful trait; trait budget = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 1,
        "concept": {
          "pt-BR": "Boticária bondosa que zela pela saúde dos aldeões",
          "en": "Kindly apothecary who looks after the villagers' health"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Compassiva",
            "en": "Compassionate"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra da Curandeira (d6). Único traço tipo-Core; rola para acalmar e tratar quem chega à sua porta. Carrega a keyword Mãos Gentis.</p>",
              "en": "<p>The Healer's neutral attitude (d6). Her only Core-like trait; rolled to soothe and treat whoever comes to her door. Carries the Gentle Hands keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Mãos Gentis",
                "en": "Gentle Hands"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/life/cross-flared-green.webp",
          "name": {
            "pt-BR": "Arte Curativa",
            "en": "Healing Craft"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) da Curandeira: ervas, ataduras e uma prece restauram traços exaustos e tratam ferimentos. Conta para o limite de traços.</p>",
              "en": "<p>The Healer's helpful trait (adversary category): herbs, bandages, and a prayer restore exhausted traits and mend wounds. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Estoque escasso",
                "en": "Scarce supply"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Mãos Gentis",
            "en": "Gentle Hands"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude da Curandeira: seu toque tranquiliza e seu cuidado faz pacientes confiarem nela. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Healer's attitude keyword: her touch calms and her care makes patients trust her. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Estoque escasso",
            "en": "Scarce supply"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Os melhores remédios acabam rápido.</p>",
              "en": "<p>The best remedies run out fast.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/magic/holy/chalice-glowing-gold.webp",
          "name": {
            "pt-BR": "Boticária Astuta",
            "en": "Cunning Apothecary"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Os mesmos óleos e ervas que curam podem adormecer, arder os olhos ou virar o estômago. Quando alguém ameaça sua vila, Mãe Wynna atira um punhado de pó nos olhos ou destampa um frasco de vapores acres para deixar o agressor tonto e indefeso.</p>",
              "en": "<p>The same oils and herbs that heal can lull to sleep, sting the eyes, or turn the stomach. When someone threatens her village, Mother Wynna flings a fistful of powder or uncorks a vial of acrid vapors to leave an aggressor dizzy and helpless.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Pacifista",
                "en": "Pacifist"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Pacifista",
            "en": "Pacifist"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Recusa-se a causar dano duradouro e hesita sempre que um golpe pode ferir de verdade.</p>",
              "en": "<p>She refuses to deal lasting harm and hesitates whenever a blow might truly wound.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "capita-mira-da-guarda-da-cidade",
      "type": "adversary",
      "img": "icons/environment/people/infantry-armored.webp",
      "tokenImg": "icons/environment/people/infantry-armored.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Capitã Mira, da Guarda da Cidade",
        "en": "Captain Mira of the Town Guard"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Capitã da guarda municipal (Poder 2) que mantém a ordem e pode escoltar ou apoiar a party. Bloco de Adversário usado só por conveniência — é amistosa enquanto a lei for respeitada. Atitude + 1 traço útil; orçamento de traços = 4.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. The town guard captain (Power 2) who keeps order and may escort or back up the party. Adversary stat block used purely for convenience — she is friendly so long as the law is respected. Attitude + 1 helpful trait; trait budget = 4.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 2,
        "concept": {
          "pt-BR": "Oficial reta que comanda a guarda da cidade",
          "en": "Upright officer who commands the town guard"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Vigilante",
            "en": "Watchful"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra da Capitã (d6). Único traço tipo-Core; rola para impor ordem, interrogar e avaliar ameaças. Carrega a keyword Autoridade.</p>",
              "en": "<p>The Captain's neutral attitude (d6). Her only Core-like trait; rolled to impose order, question, and size up threats. Carries the Authority keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Autoridade",
                "en": "Authority"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/infantry-army.webp",
          "name": {
            "pt-BR": "Comando da Guarda",
            "en": "Guard Command"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) da Capitã: convoca a guarda da cidade, abre portões e oferece escolta a quem ela considera confiável. Conta para o limite de traços.</p>",
              "en": "<p>The Captain's helpful trait (adversary category): she summons the town guard, opens gates, and offers an escort to those she deems trustworthy. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Presa às regras",
                "en": "By the book"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
          "name": {
            "pt-BR": "Autoridade",
            "en": "Authority"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude da Capitã: sua patente faz cidadãos e recrutas obedecerem sem hesitar. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Captain's attitude keyword: her rank makes citizens and recruits obey without hesitation. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Presa às regras",
            "en": "By the book"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Não dobra a lei nem por bons motivos.</p>",
              "en": "<p>Won't bend the law even for good reasons.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/infantry-armored.webp",
          "name": {
            "pt-BR": "Lâmina da Lei",
            "en": "Blade of the Law"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Mira saca a espada de oficial e investe com a precisão de quem treinou mil patrulhas, abrindo a guarda do alvo com um golpe medido antes de prendê-lo.</p>",
              "en": "<p>Mira draws her officer's blade and lunges with the precision of a thousand drilled patrols, beating aside her foe's guard with one measured cut before pinning them down.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Honra Marcial",
                "en": "Martial Honor"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Honra Marcial",
            "en": "Martial Honor"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Ela se recusa a golpear um inimigo desarmado ou que já se rendeu.</p>",
              "en": "<p>She refuses to strike a foe who is disarmed or has already surrendered.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/infantry-armored.webp",
          "name": {
            "pt-BR": "Olho de Falcão",
            "en": "Hawk's Eye"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Anos vigiando os becos lhe deram um olhar afiado: Mira percebe o ladrão na multidão, o punhal escondido na manga e a mentira na voz antes que o golpe venha.</p>",
              "en": "<p>Years watching the alleys honed her gaze: Mira spots the thief in the crowd, the dagger up a sleeve, and the lie in a voice before the blow ever lands.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Suspeita Demais",
                "en": "Overly Suspicious"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Suspeita Demais",
            "en": "Overly Suspicious"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Sua desconfiança constante a faz acusar inocentes e ignorar quem a bajula.</p>",
              "en": "<p>Her constant distrust leads her to accuse the innocent and overlook anyone who flatters her.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "velho-tobin-o-sabio-andarilho",
      "type": "adversary",
      "img": "icons/sundries/books/book-embossed-gold-green.webp",
      "tokenImg": "icons/environment/people/cleric-grey.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Velho Tobin, o Sábio Andarilho",
        "en": "Old Tobin, the Wandering Sage"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Sábio e loremaster errante (Poder 1) que decifra textos antigos e responde dúvidas sobre o mundo. Bloco de Adversário usado só por conveniência — é amistoso. Atitude + 1 traço útil; orçamento de traços = 3.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. A wandering sage and loremaster (Power 1) who deciphers ancient texts and answers questions about the world. Adversary stat block used purely for convenience — he is friendly. Attitude + 1 helpful trait; trait budget = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 1,
        "concept": {
          "pt-BR": "Erudito viajante que coleciona saberes esquecidos",
          "en": "Traveling scholar who collects forgotten lore"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Contemplativo",
            "en": "Contemplative"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra do Sábio (d6). Único traço tipo-Core; rola para recordar lendas, ler runas e ponderar enigmas. Carrega a keyword Erudito.</p>",
              "en": "<p>The Sage's neutral attitude (d6). His only Core-like trait; rolled to recall legends, read runes, and ponder riddles. Carries the Erudite keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Erudito",
                "en": "Erudite"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/scrolls/scroll-bound-blue-brown.webp",
          "name": {
            "pt-BR": "Conhecimento Antigo",
            "en": "Ancient Knowledge"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) do Sábio: ele identifica relíquias, traduz idiomas mortos e revela a história por trás de um lugar ou criatura. Conta para o limite de traços.</p>",
              "en": "<p>The Sage's helpful trait (adversary category): he identifies relics, translates dead languages, and reveals the history behind a place or creature. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Distraído",
                "en": "Distracted"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/sundries/books/book-embossed-jewel-blue-red.webp",
          "name": {
            "pt-BR": "Erudito",
            "en": "Erudite"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude do Sábio: décadas de estudo lhe dão respostas onde outros só veem mistério. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Sage's attitude keyword: decades of study give him answers where others see only mystery. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Distraído",
            "en": "Distracted"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Divaga e se perde em tangentes eruditas.</p>",
              "en": "<p>Rambles and loses himself in scholarly tangents.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/sundries/books/book-embossed-gold-green.webp",
          "name": {
            "pt-BR": "Palavra do Viajante",
            "en": "Wayfarer's Word"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Tendo cruzado mil estradas e ouvido tantas línguas, Tobin desarma desavenças com uma frase certeira no momento certo. Onde outros sacam a espada, ele oferece uma história, um nome esquecido ou uma verdade incômoda — e o oponente baixa a guarda sem perceber.</p>",
              "en": "<p>Having walked a thousand roads and heard as many tongues, Tobin defuses a quarrel with the right phrase at the right moment. Where others draw steel he offers a tale, a forgotten name, or an uncomfortable truth — and his opponent lowers their guard without noticing.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Frágil",
                "en": "Frail"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Frágil",
            "en": "Frail"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Os anos pesam: qualquer confronto físico direto o derruba depressa.</p>",
              "en": "<p>The years weigh on him: any direct physical confrontation brings him down quickly.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "hilda-a-taverneira",
      "type": "adversary",
      "img": "icons/tools/instruments/bell-brass.webp",
      "tokenImg": "icons/environment/people/commoner.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Hilda, a Taverneira",
        "en": "Hilda the Innkeeper"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Taverneira (Poder 1) que serve bebida e, mais importante, escuta tudo — uma rede de boatos numa pessoa só. Bloco de Adversário usado só por conveniência — é amistosa. Atitude + 1 traço útil; orçamento de traços = 3.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. An innkeeper (Power 1) who pours drinks and, more importantly, hears everything — a rumor network in one person. Adversary stat block used purely for convenience — she is friendly. Attitude + 1 helpful trait; trait budget = 3.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 1,
        "concept": {
          "pt-BR": "Dona de estalagem que sabe de todos os segredos da cidade",
          "en": "Inn owner who knows every secret in town"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Acolhedora",
            "en": "Welcoming"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra da Taverneira (d8). Único traço tipo-Core; rola para receber hóspedes, acalmar bêbados e puxar conversa. Carrega a keyword Bem-Relacionada.</p>",
              "en": "<p>The Innkeeper's neutral attitude (d8). Her only Core-like trait; rolled to host guests, calm drunks, and strike up conversation. Carries the Well-Connected keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Bem-Relacionada",
                "en": "Well-Connected"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/tools/instruments/bell-gold.webp",
          "name": {
            "pt-BR": "Rede de Boatos",
            "en": "Rumor Network"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) da Taverneira: por uma rodada de bebida ou uma boa fofoca, ela revela rumores, pistas e quem chegou à cidade. Conta para o limite de traços.</p>",
              "en": "<p>The Innkeeper's helpful trait (adversary category): for a round of drinks or a juicy bit of gossip, she shares rumors, leads, and word of who's arrived in town. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Boca solta",
                "en": "Loose lips"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/tools/instruments/bell-silver.webp",
          "name": {
            "pt-BR": "Bem-Relacionada",
            "en": "Well-Connected"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude da Taverneira: ela conhece alguém em cada ofício e abre portas com uma boa palavra. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Innkeeper's attitude keyword: she knows someone in every trade and opens doors with a good word. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Boca solta",
            "en": "Loose lips"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O que ela ouve, ela acaba contando.</p>",
              "en": "<p>What she hears, she ends up telling.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/tools/instruments/bell-brass.webp",
          "name": {
            "pt-BR": "Sussurro de Balcão",
            "en": "Barside Whisper"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Inclinada sobre o balcão, Hilda solta o segredo certo no ouvido certo. Uma confidência sussurrada que abre portas, dissolve uma briga ou planta a desconfiança exata onde ela mais fere.</p>",
              "en": "<p>Leaning across the bar, Hilda drops the right secret into the right ear. A whispered confidence that opens doors, defuses a brawl, or plants the precise distrust where it cuts deepest.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Presa ao Balcão",
                "en": "Bound to the Bar"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Presa ao Balcão",
            "en": "Bound to the Bar"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Longe da estalagem ela não tem fontes nem ouvidos, e o sussurro perde toda a força.</p>",
              "en": "<p>Away from her inn she has no sources and no ears, and the whisper loses all its power.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "kael-o-batedor-da-fronteira",
      "type": "adversary",
      "img": "icons/environment/people/archer.webp",
      "tokenImg": "icons/environment/people/archer.webp",
      "disposition": 0,
      "name": {
        "pt-BR": "Kael, o Batedor da Fronteira",
        "en": "Kael, the Frontier Scout"
      },
      "system": {
        "description": {
          "pt-BR": "<p>NPC aliado neutro para a pasta de NPCs. Batedor e guia de fronteira (Poder 2) que conhece as trilhas selvagens e pode levar a party por terras perigosas. Bloco de Adversário usado só por conveniência — é amistoso. Atitude + 1 traço útil; orçamento de traços = 4.</p>",
          "en": "<p>Neutral ally NPC for the NPCs folder. A frontier scout and guide (Power 2) who knows the wild trails and can lead the party through dangerous country. Adversary stat block used purely for convenience — he is friendly. Attitude + 1 helpful trait; trait budget = 4.</p>"
        },
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "scale": 1,
        "power": 2,
        "concept": {
          "pt-BR": "Rastreador solitário que guia viajantes pelo ermo",
          "en": "Lone tracker who guides travelers through the wilds"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
          "name": {
            "pt-BR": "Cauteloso",
            "en": "Cautious"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atitude neutra do Batedor (d6). Único traço tipo-Core; rola para farejar emboscadas, ler o tempo e medir estranhos. Carrega a keyword Reservado.</p>",
              "en": "<p>The Scout's neutral attitude (d6). His only Core-like trait; rolled to sniff out ambushes, read the weather, and size up strangers. Carries the Reserved keyword.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Reservado",
                "en": "Reserved"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/wilderness/cave-entrance-mountain.webp",
          "name": {
            "pt-BR": "Conhecimento das Trilhas",
            "en": "Trailcraft"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Traço útil (categoria adversary) do Batedor: ele encontra atalhos seguros, rastreia presas e fugitivos e guia a party por florestas, pântanos e passos de montanha. Conta para o limite de traços.</p>",
              "en": "<p>The Scout's helpful trait (adversary category): he finds safe shortcuts, tracks game and fugitives, and guides the party through forests, swamps, and mountain passes. Counts toward the trait limit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Solitário",
                "en": "Loner"
              }
            ]
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/nature/cornucopia-orange.webp",
          "name": {
            "pt-BR": "Reservado",
            "en": "Reserved"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Keyword da atitude do Batedor: fala pouco, observa muito e revela suas intenções só quando confia. Item de apoio para o hover do pill.</p>",
              "en": "<p>The Scout's attitude keyword: he speaks little, watches much, and reveals his intentions only once he trusts you. Support item for the pill hover.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/death/bones-crossed-gray.webp",
          "name": {
            "pt-BR": "Solitário",
            "en": "Loner"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Desconfia de grupos grandes e cidades cheias.</p>",
              "en": "<p>Distrusts large groups and crowded towns.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/archer.webp",
          "name": {
            "pt-BR": "Tiro Certeiro da Espreita",
            "en": "Stalker's True Shot"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Kael dispara do esconderijo antes que percebam sua presença, cravando a flecha exatamente onde dói mais.</p>",
              "en": "<p>Kael looses an arrow from cover before anyone marks his presence, sinking the shaft exactly where it hurts most.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Exposto",
                "en": "Exposed"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Exposto",
            "en": "Exposed"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A céu aberto, sem cobertura para se esconder, sua pontaria perde a vantagem mortal.</p>",
              "en": "<p>Caught in the open with no cover to hide behind, his aim loses its deadly edge.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/archer.webp",
          "name": {
            "pt-BR": "Fantasma do Ermo",
            "en": "Ghost of the Wilds"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Conhecendo cada toca e desfiladeiro, Kael some na vegetação e reaparece longe, deixando perseguidores sem rastro algum.</p>",
              "en": "<p>Knowing every burrow and ravine, Kael melts into the brush and resurfaces far away, leaving pursuers without a single track.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Confinado",
                "en": "Cornered"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Confinado",
            "en": "Cornered"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Entre paredes de pedra ou masmorras, sem mato nem horizonte, ele não tem para onde sumir.</p>",
              "en": "<p>Hemmed in by stone walls or dungeons, with no brush or horizon, he has nowhere to vanish to.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "bandido-de-estrada",
      "type": "adversary",
      "img": "icons/environment/people/archer.webp",
      "tokenImg": "icons/environment/people/archer.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Bandido de Estrada",
        "en": "Highway Bandit"
      },
      "system": {
        "power": 1,
        "scale": 1,
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "description": {
          "pt-BR": "<p>Criatura hostil para a pasta Criaturas. Um salteador oportunista que embosca viajantes nas estradas isoladas, exigindo moedas sob a ameaça de um arco. Poder 1: uma atitude e um traço de adversário.</p>",
          "en": "<p>Hostile creature for the Creatures folder. An opportunistic robber who ambushes travelers on lonely roads, demanding coin at the threat of a drawn bow. Power 1: one attitude and one adversary trait.</p>"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/environment/people/archer.webp",
          "name": {
            "pt-BR": "Ameaçador",
            "en": "Menacing"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A postura agressiva do bandido: intimidação, exigências e violência rápida quando contrariado.</p>",
              "en": "<p>The bandit's aggressive posture: intimidation, demands, and swift violence when crossed.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Intimidação",
                "en": "Intimidation"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/archer.webp",
          "name": {
            "pt-BR": "Emboscada na Estrada",
            "en": "Roadside Ambush"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Ataca de surpresa por trás de pedras e arbustos, com flecha pronta no arco e uma rota de fuga já planejada.</p>",
              "en": "<p>Strikes by surprise from behind rocks and brush, arrow already nocked and an escape route already planned.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Covarde",
                "en": "Coward"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Covarde",
            "en": "Coward"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Foge quando a luta vira contra ele.</p>",
              "en": "<p>Flees when the fight turns against him.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/environment/people/archer.webp",
          "name": {
            "pt-BR": "A Bolsa ou a Vida",
            "en": "Your Coin or Your Life"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Encurrala o viajante com a lâmina na garganta e exige que entregue tudo de valor, contando que o medo faça o trabalho que a luta faria.</p>",
              "en": "<p>Corners the traveler with a blade at the throat and demands every valuable, trusting fear to do the work a fight otherwise would.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Ganancioso",
                "en": "Greedy"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Ganancioso",
            "en": "Greedy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Distrai-se com o saque e baixa a guarda na hora de revistar os bolsos da vítima.</p>",
              "en": "<p>Gets distracted by loot and drops his guard while rifling through the victim's pockets.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Intimidação",
            "en": "Intimidation"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Usa ameaças e violência para dobrar a vontade das vítimas.</p>",
              "en": "<p>Uses threats and violence to bend victims to his will.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "aranha-gigante",
      "type": "adversary",
      "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
      "tokenImg": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Aranha Gigante",
        "en": "Giant Spider"
      },
      "system": {
        "power": 2,
        "scale": 1,
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "description": {
          "pt-BR": "<p>Criatura hostil para a pasta Criaturas. Uma aberração de oito patas do tamanho de um cavalo, que tece teias entre as árvores e injeta veneno paralisante nas presas. Poder 2: uma atitude e um traço de adversário, mais um traço especial Blindado (carapaça) que não conta no orçamento.</p>",
          "en": "<p>Hostile creature for the Creatures folder. An eight-legged horror the size of a horse, weaving webs between the trees and injecting paralyzing venom into its prey. Power 2: one attitude and one adversary trait, plus an Armored special trait (carapace) that does not count toward the budget.</p>"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
          "name": {
            "pt-BR": "Predadora",
            "en": "Predatory"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O instinto caçador da aranha: paciência, emboscada e fome implacável por carne quente.</p>",
              "en": "<p>The spider's hunting instinct: patience, ambush, and a relentless hunger for warm flesh.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Caça",
                "en": "Hunt"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
          "name": {
            "pt-BR": "Presas Venenosas e Teia",
            "en": "Venomous Fangs and Web"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Morde com presas que injetam veneno paralisante e prende as presas em fios de teia pegajosa e resistente.</p>",
              "en": "<p>Bites with fangs that inject paralyzing venom and snares prey in strands of sticky, resilient web.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Vulnerável ao fogo",
                "en": "Vulnerable to fire"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
          "name": {
            "pt-BR": "Carapaça Blindada",
            "en": "Armored Carapace"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Um exoesqueto quitinoso e endurecido que reveste o corpo da aranha, desviando golpes que matariam uma fera comum.</p>",
              "en": "<p>A hardened, chitinous exoskeleton sheathing the spider's body, turning aside blows that would kill a common beast.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 1,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Vulnerável ao fogo",
            "en": "Vulnerable to fire"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Chamas a fazem recuar em pânico.</p>",
              "en": "<p>Flames make it recoil in panic.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
          "name": {
            "pt-BR": "Bote da Emboscada",
            "en": "Ambush Pounce"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Imóvel entre as sombras das teias, ela espera a presa se aproximar e desfere um bote relâmpago, derrubando o alvo desprevenido sob o peso de oito patas.</p>",
              "en": "<p>Motionless among the shadows of its webs, it waits for prey to wander close, then strikes in a lightning pounce that bowls the unwary target over beneath the weight of eight legs.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Telegrafado",
                "en": "Telegraphed"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Telegrafado",
            "en": "Telegraphed"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O recuo tenso antes do salto denuncia o ataque, dando à presa atenta um instante para se esquivar.</p>",
              "en": "<p>The tense crouch before the leap betrays the attack, giving an alert target a heartbeat to dodge.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/invertebrates/spider-mandibles-brown.webp",
          "name": {
            "pt-BR": "Andarilha das Paredes",
            "en": "Wall-Crawler"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Escala tetos, paredes e troncos sem esforço, descendo por um fio de seda para atacar de ângulos impossíveis e fugir para o alto fora de alcance.</p>",
              "en": "<p>It scales ceilings, walls and tree trunks with ease, dropping on a strand of silk to strike from impossible angles and retreat overhead beyond reach.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Pesada",
                "en": "Heavy"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Pesada",
            "en": "Heavy"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Seu volume tensiona a seda; superfícies frágeis cedem e a fazem despencar.</p>",
              "en": "<p>Its bulk strains the silk; flimsy surfaces give way and send it crashing down.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Caça",
            "en": "Hunt"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Persegue e ataca presas com instinto predatório implacável.</p>",
              "en": "<p>Stalks and strikes prey with relentless predatory instinct.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    },
    {
      "id": "espirito-inquieto",
      "type": "adversary",
      "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
      "tokenImg": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
      "disposition": -1,
      "name": {
        "pt-BR": "Espírito Inquieto",
        "en": "Restless Spirit"
      },
      "system": {
        "power": 2,
        "scale": 1,
        "source": {
          "pt-BR": "Fixtures de Teste",
          "en": "Test Fixtures"
        },
        "description": {
          "pt-BR": "<p>Criatura hostil para a pasta Criaturas. Uma alma morta-viva atada ao mundo por um pesar não resolvido, que paira gélida e translúcida e ataca os vivos com toques que drenam a vida. Poder 2: uma atitude e um traço de adversário, mais um traço especial Fortemente Blindado que representa a resiliência incorpórea (deve ser exaurido primeiro) e não conta no orçamento.</p>",
          "en": "<p>Hostile creature for the Creatures folder. An undead soul bound to the world by unresolved grief, drifting cold and translucent and lashing at the living with life-draining touches. Power 2: one attitude and one adversary trait, plus a Heavily Armored special trait representing incorporeal resilience (must be exhausted first) that does not count toward the budget.</p>"
        }
      },
      "items": [
        {
          "type": "trait",
          "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          "name": {
            "pt-BR": "Atormentado",
            "en": "Tormented"
          },
          "system": {
            "description": {
              "pt-BR": "<p>A dor e a fúria do espírito: incapaz de descansar, lança seu sofrimento contra qualquer alma viva que se aproxime.</p>",
              "en": "<p>The spirit's grief and fury: unable to rest, it hurls its suffering at any living soul that draws near.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "attitude",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": true,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [
              {
                "pt-BR": "Assombrar",
                "en": "Haunt"
              }
            ],
            "drawbacks": []
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          "name": {
            "pt-BR": "Toque Drenante",
            "en": "Draining Touch"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Atravessa a carne com mãos espectrais e gélidas que arrancam o calor e a vitalidade do corpo da vítima.</p>",
              "en": "<p>Reaches through flesh with cold, spectral hands that tear the warmth and vitality from a victim's body.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Atado ao luto",
                "en": "Bound by grief"
              }
            ]
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          "name": {
            "pt-BR": "Forma Incorpórea",
            "en": "Incorporeal Form"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Sem corpo físico para ferir, as armas mundanas atravessam sua forma translúcida; só a fé ou a magia conseguem dissipar o espírito.</p>",
              "en": "<p>With no physical body to wound, mundane weapons pass through its translucent form; only faith or magic can dispel the spirit.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "special",
            "maxDie": "d6",
            "currentDie": "d6",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": false
            },
            "defeat": {
              "counts": true,
              "extraRequired": 2,
              "mustBeExhaustedFirst": true
            },
            "adversary": {
              "countsTowardTraitLimit": false,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": []
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Atado ao luto",
            "en": "Bound by grief"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Não pode se afastar do local de sua morte.</p>",
              "en": "<p>Cannot leave the site of its death.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          "name": {
            "pt-BR": "Lamento Dilacerante",
            "en": "Keening Wail"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O espírito solta um gemido de pura agonia que ecoa dentro do peito dos vivos. Quem ouve sente o peso do pesar alheio sufocar a própria coragem, tropeçando em lágrimas que não são suas.</p>",
              "en": "<p>The spirit looses a moan of pure agony that echoes inside the chests of the living. Those who hear it feel another's grief smother their own courage, stumbling under tears that were never theirs.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d8",
            "currentDie": "d8",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Eco Silenciado",
                "en": "Silenced Echo"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Eco Silenciado",
            "en": "Silenced Echo"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O lamento não atravessa o silêncio absoluto, e alvos surdos ou ensurdecidos ficam imunes a ele.</p>",
              "en": "<p>The wail cannot pierce true silence, and deaf or deafened targets are immune to it.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "trait",
          "img": "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          "name": {
            "pt-BR": "Reviver o Luto",
            "en": "Replay the Mourning"
          },
          "system": {
            "description": {
              "pt-BR": "<p>O espírito reencena o instante de seu pesar não resolvido, e o cenário se distorce ao redor dos vivos com visões do mesmo tormento. Presos no luto alheio, os alvos confundem memória com realidade e baixam a guarda.</p>",
              "en": "<p>The spirit re-enacts the moment of its unresolved sorrow, and the scene warps around the living with visions of that same torment. Trapped in another's mourning, targets mistake memory for reality and let their guard fall.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            },
            "category": "adversary",
            "maxDie": "d10",
            "currentDie": "d10",
            "exhausted": false,
            "temporary": false,
            "locked": false,
            "revealed": true,
            "rollable": true,
            "autoShiftOnRoll": true,
            "features": {
              "usesKeywords": false,
              "usesDrawbacks": true
            },
            "defeat": {
              "counts": true,
              "extraRequired": 0,
              "mustBeExhaustedFirst": false
            },
            "adversary": {
              "countsTowardTraitLimit": true,
              "extraActions": 0
            },
            "scale": {
              "custom": false,
              "value": 1
            },
            "loadout": "",
            "keywords": [],
            "drawbacks": [
              {
                "pt-BR": "Memória Aberta",
                "en": "Open Memory"
              }
            ]
          }
        },
        {
          "type": "drawback",
          "img": "icons/magic/control/fear-fright-mask-orange.webp",
          "name": {
            "pt-BR": "Memória Aberta",
            "en": "Open Memory"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Enquanto reencena o luto, o espírito revela a origem de seu pesar, abrindo brecha para ser acalmado ou banido por quem souber confortá-lo.</p>",
              "en": "<p>While replaying its mourning, the spirit lays bare the source of its grief, leaving it open to being soothed or banished by anyone who knows how to comfort it.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        },
        {
          "type": "keyword",
          "img": "icons/magic/life/ankh-gold-blue.webp",
          "name": {
            "pt-BR": "Assombrar",
            "en": "Haunt"
          },
          "system": {
            "description": {
              "pt-BR": "<p>Aterroriza os vivos com sua presença gélida e atormentada.</p>",
              "en": "<p>Terrifies the living with its cold, tormented presence.</p>"
            },
            "source": {
              "pt-BR": "Fixtures de Teste",
              "en": "Test Fixtures"
            }
          }
        }
      ]
    }
  ],
  "items": [
    {
      "id": "vigor",
      "type": "trait",
      "img": "icons/magic/control/buff-strength-muscle-damage-orange.webp",
      "name": "Vigor",
      "system": {
        "description": {
          "pt-BR": "<p>Traço Core padrão (usa apenas Desvantagens) com maxDie d4, o dado mais forte, para testar o limite superior da escala de dados.</p>",
          "en": "<p>Standard Core Trait (uses Drawbacks only) with maxDie d4, the strongest die, to test the upper bound of the die scale.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "core",
        "maxDie": "d4",
        "currentDie": "d4",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "esgrima-arcana",
      "type": "trait",
      "img": "icons/magic/fire/beam-jet-stream-blue.webp",
      "name": {
        "pt-BR": "Esgrima Arcana",
        "en": "Arcane Fencing"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Focus de personagem com 2 Palavras-chave + 1 Desvantagem e Escala customizada PARA CIMA (3) para testar override de Escala e os pills de hover.</p>",
          "en": "<p>Character Focus Trait with 2 Keywords + 1 Drawback and a custom Scale UPWARD (3) to test Scale override and the hover pills.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "focus",
        "maxDie": "d6",
        "currentDie": "d8",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": true,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": true,
          "value": 3
        },
        "loadout": {
          "pt-BR": "Espada rúnica",
          "en": "Runic sword"
        },
        "keywords": [
          {
            "pt-BR": "Lâmina Flamejante",
            "en": "Flaming Blade"
          },
          {
            "pt-BR": "Ricochete Mágico",
            "en": "Magic Ricochet"
          }
        ],
        "drawbacks": [
          {
            "pt-BR": "Recuo Brusco",
            "en": "Harsh Recoil"
          }
        ]
      }
    },
    {
      "id": "bolsa-do-aventureiro",
      "type": "trait",
      "img": "icons/containers/bags/coinpouch-leather-orange.webp",
      "name": {
        "pt-BR": "Bolsa do Aventureiro",
        "en": "Adventurer's Pouch"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Pack (sem Palavras-chave nem Desvantagens) e não-rolável para testar um traço puramente de inventário sem botão de rolagem.</p>",
          "en": "<p>Pack Trait (no Keywords or Drawbacks) and non-rollable, to test a purely inventory-style trait with no roll button.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "pack",
        "maxDie": "d8",
        "currentDie": "d8",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": false,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": {
          "pt-BR": "Corda, tochas, rações",
          "en": "Rope, torches, rations"
        },
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "fardo-de-seda",
      "type": "trait",
      "img": "icons/commodities/cloth/cloth-bolt-gold.webp",
      "name": {
        "pt-BR": "Fardo de Seda",
        "en": "Bolt of Silk"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Cargo (sem Palavras-chave nem Desvantagens) marcado como TEMPORÁRIO para testar o indicador de traço temporário e sua remoção.</p>",
          "en": "<p>Cargo Trait (no Keywords or Drawbacks) flagged as TEMPORARY to test the temporary-trait indicator and its removal.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "cargo",
        "maxDie": "d6",
        "currentDie": "d6",
        "exhausted": false,
        "temporary": true,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": {
          "pt-BR": "Carga frágil",
          "en": "Fragile cargo"
        },
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "bravata",
      "type": "trait",
      "img": "icons/creatures/abilities/cougar-roar-rush-orange.webp",
      "name": {
        "pt-BR": "Bravata",
        "en": "Bravado"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Attitude (usa Palavras-chave, sem Desvantagens) — o traço Core-like de um adversário, começando em dado baixo d6 como manda a regra.</p>",
          "en": "<p>Attitude Trait (uses Keywords, no Drawbacks) — an adversary's Core-like trait, starting at the low d6 die as the rule requires.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "attitude",
        "maxDie": "d6",
        "currentDie": "d6",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": true,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [
          {
            "pt-BR": "Intimidador",
            "en": "Intimidating"
          }
        ],
        "drawbacks": []
      }
    },
    {
      "id": "garras-dilacerantes",
      "type": "trait",
      "img": "icons/magic/control/fear-fright-monster-green.webp",
      "name": {
        "pt-BR": "Garras Dilacerantes",
        "en": "Rending Claws"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço ofensivo de Adversary com 1 ação extra (adversary.extraActions 1) para testar o cálculo de ações/rodada do adversário.</p>",
          "en": "<p>Offensive Adversary Trait with 1 extra action (adversary.extraActions 1) to test the adversary's actions-per-round calculation.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "adversary",
        "maxDie": "d6",
        "currentDie": "d6",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 1
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "blindado",
      "type": "trait",
      "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
      "name": {
        "pt-BR": "Blindado",
        "en": "Armored"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Special preset Blindado: exige 1 derrota extra, não conta para o limite de traços do adversário. Testa armadura simples.</p>",
          "en": "<p>Special Trait, Armored preset: requires 1 extra defeat, doesn't count toward the adversary's trait limit. Tests simple armor.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "special",
        "maxDie": "d8",
        "currentDie": "d8",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 1,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": false,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "fortemente-blindado",
      "type": "trait",
      "img": "icons/magic/defensive/armor-stone-skin.webp",
      "name": {
        "pt-BR": "Fortemente Blindado",
        "en": "Heavily Armored"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Special bloqueador: precisa ser esgotado primeiro e exige 2 derrotas extras (mustBeExhaustedFirst true). Testa a regra de bloqueio de derrota.</p>",
          "en": "<p>Blocking Special Trait: must be exhausted first and requires 2 extra defeats (mustBeExhaustedFirst true). Tests the defeat-blocking rule.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "special",
        "maxDie": "d8",
        "currentDie": "d8",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 2,
          "mustBeExhaustedFirst": true
        },
        "adversary": {
          "countsTowardTraitLimit": false,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "moral-do-grupo",
      "type": "trait",
      "img": "icons/sundries/flags/banner-flag-pink.webp",
      "name": {
        "pt-BR": "Moral do Grupo",
        "en": "Party Morale"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Party (status-style): usa Palavras-chave e Desvantagens, mas autoShiftOnRoll false para testar um traço compartilhado que não desce de dado ao rolar.</p>",
          "en": "<p>Party Trait (status-style): uses Keywords and Drawbacks, but autoShiftOnRoll false to test a shared trait that doesn't step its die down when rolled.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "party",
        "maxDie": "d8",
        "currentDie": "d8",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": false,
        "features": {
          "usesKeywords": true,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [
          {
            "pt-BR": "Coesão",
            "en": "Cohesion"
          }
        ],
        "drawbacks": [
          {
            "pt-BR": "Discórdia",
            "en": "Discord"
          }
        ]
      }
    },
    {
      "id": "sorte-estranha",
      "type": "trait",
      "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
      "name": {
        "pt-BR": "Sorte Estranha",
        "en": "Strange Luck"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Custom com Escala customizada PARA BAIXO (1) sobre um maxDie d12, o dado mais fraco. Testa override de escala reduzida e o limite inferior de dados.</p>",
          "en": "<p>Custom Trait with a custom Scale DOWNWARD (1) on a maxDie d12, the weakest die. Tests reduced-scale override and the lower bound of the die range.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "custom",
        "maxDie": "d12",
        "currentDie": "d12",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": true,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "erudicao",
      "type": "trait",
      "img": "icons/sundries/books/book-embossed-blue.webp",
      "name": {
        "pt-BR": "Erudição",
        "en": "Scholarship"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Focus ESGOTADO (exhausted true, currentDie d12) para testar a apresentação de um traço exausto e seu recovery.</p>",
          "en": "<p>EXHAUSTED Focus Trait (exhausted true, currentDie d12) to test the presentation of an exhausted trait and its recovery.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "focus",
        "maxDie": "d6",
        "currentDie": "d12",
        "exhausted": true,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": true,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [
          {
            "pt-BR": "Memória Eidética",
            "en": "Eidetic Memory"
          }
        ],
        "drawbacks": [
          {
            "pt-BR": "Distração",
            "en": "Distraction"
          }
        ]
      }
    },
    {
      "id": "segredo-oculto",
      "type": "trait",
      "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
      "name": {
        "pt-BR": "Segredo Oculto",
        "en": "Hidden Secret"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Focus TRAVADO e oculto (locked true, revealed false) para testar a revelação pelo GM e o cadeado que impede edição pelo jogador.</p>",
          "en": "<p>LOCKED and hidden Focus Trait (locked true, revealed false) to test GM reveal and the lock that prevents player editing.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "focus",
        "maxDie": "d8",
        "currentDie": "d10",
        "exhausted": false,
        "temporary": false,
        "locked": true,
        "revealed": false,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": true,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [
          {
            "pt-BR": "Verdade Velada",
            "en": "Veiled Truth"
          }
        ],
        "drawbacks": [
          {
            "pt-BR": "Maldição Latente",
            "en": "Latent Curse"
          }
        ]
      }
    },
    {
      "id": "grupo-pequeno",
      "type": "trait",
      "img": "icons/magic/defensive/armor-shield-barrier-steel.webp",
      "name": {
        "pt-BR": "Grupo Pequeno",
        "en": "Small Group"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Special preset Grupo Pequeno: 1 derrota extra e 1 ação extra. Testa adversário em bando que age mais vezes mas não conta no limite de traços.</p>",
          "en": "<p>Special Trait, Small Group preset: 1 extra defeat and 1 extra action. Tests a swarm adversary that acts more often but doesn't count toward the trait limit.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "special",
        "maxDie": "d6",
        "currentDie": "d6",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": false
        },
        "defeat": {
          "counts": true,
          "extraRequired": 1,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": false,
          "extraActions": 1
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": []
      }
    },
    {
      "id": "fe-inabalavel",
      "type": "trait",
      "img": "icons/magic/holy/chalice-glowing-gold-water.webp",
      "name": {
        "pt-BR": "Fé Inabalável",
        "en": "Unshakable Faith"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Traço Core padrão com currentDie já reduzido (maxDie d8, currentDie d10) para testar a exibição de um traço que sofreu shift mas ainda não esgotou.</p>",
          "en": "<p>Standard Core Trait with currentDie already reduced (maxDie d8, currentDie d10) to test the display of a trait that has shifted but not yet exhausted.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "category": "core",
        "maxDie": "d8",
        "currentDie": "d10",
        "exhausted": false,
        "temporary": false,
        "locked": false,
        "revealed": true,
        "rollable": true,
        "autoShiftOnRoll": true,
        "features": {
          "usesKeywords": false,
          "usesDrawbacks": true
        },
        "defeat": {
          "counts": true,
          "extraRequired": 0,
          "mustBeExhaustedFirst": false
        },
        "adversary": {
          "countsTowardTraitLimit": true,
          "extraActions": 0
        },
        "scale": {
          "custom": false,
          "value": 1
        },
        "loadout": "",
        "keywords": [],
        "drawbacks": [
          {
            "pt-BR": "Teimosia",
            "en": "Stubbornness"
          }
        ]
      }
    },
    {
      "id": "segunda-chance",
      "type": "technique",
      "img": "icons/magic/time/clock-spinning-gold-pink.webp",
      "name": {
        "pt-BR": "Segunda Chance",
        "en": "Second Chance"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Técnica narrativa que reescreve um momento da cena. Testa recarga por sessão e descanso seguro, com 2 usos.</p>",
          "en": "<p>Narrative technique that rewrites a moment of the scene. Tests recharge on session and safe rest, with 2 uses.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "techniqueType": "narrative",
        "focus": {
          "traitId": "",
          "traitName": "",
          "scale": 2
        },
        "recharges": {
          "session": true,
          "safeRest": true,
          "unsafeRest": false
        },
        "uses": {
          "value": 2,
          "max": 2
        }
      }
    },
    {
      "id": "golpe-calculado",
      "type": "technique",
      "img": "icons/magic/light/explosion-star-blue.webp",
      "name": {
        "pt-BR": "Golpe Calculado",
        "en": "Calculated Strike"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Técnica mecânica que adiciona um dado deslocado ao ataque. Recarrega apenas em descanso seguro, com 1 uso.</p>",
          "en": "<p>Mechanical technique that adds a shifted die to the attack. Recharges only on a safe rest, with 1 use.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "techniqueType": "mechanical",
        "focus": {
          "traitId": "",
          "traitName": "",
          "scale": 2
        },
        "recharges": {
          "session": false,
          "safeRest": true,
          "unsafeRest": false
        },
        "uses": {
          "value": 1,
          "max": 1
        }
      }
    },
    {
      "id": "transcender",
      "type": "technique",
      "img": "icons/magic/control/buff-flight-wings-runes-blue.webp",
      "name": {
        "pt-BR": "Transcender",
        "en": "Transcend"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Técnica de Aumento de Escala (escala 3). Vincula-se a um Traço de Foco quando arrastada para uma ficha. Testa o binding de Scaled Up.</p>",
          "en": "<p>Scaled Up technique (scale 3). Binds to a Focus Trait when dragged onto a sheet. Tests the Scaled Up binding.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "techniqueType": "scaledUp",
        "focus": {
          "traitId": "",
          "traitName": "",
          "scale": 3
        },
        "recharges": {
          "session": true,
          "safeRest": true,
          "unsafeRest": false
        },
        "uses": {
          "value": 1,
          "max": 1
        }
      }
    },
    {
      "id": "improviso-constante",
      "type": "technique",
      "img": "icons/magic/time/arrows-circling-green.webp",
      "name": {
        "pt-BR": "Improviso Constante",
        "en": "Constant Improvisation"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Técnica narrativa à vontade, sem limite de usos (max 0). Testa técnicas ilimitadas que nunca esgotam.</p>",
          "en": "<p>At-will narrative technique with no use limit (max 0). Tests unlimited techniques that never run out.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "techniqueType": "narrative",
        "focus": {
          "traitId": "",
          "traitName": "",
          "scale": 2
        },
        "recharges": {
          "session": false,
          "safeRest": false,
          "unsafeRest": false
        },
        "uses": {
          "value": 0,
          "max": 0
        }
      }
    },
    {
      "id": "folego-renovado",
      "type": "technique",
      "img": "icons/magic/time/day-night-sunset-sunrise.webp",
      "name": {
        "pt-BR": "Fôlego Renovado",
        "en": "Renewed Vigor"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Técnica mecânica que recarrega em qualquer descanso (o Safe Rest continua aceso junto). Testa a recarga em qualquer descanso com 1 uso.</p>",
          "en": "<p>Mechanical technique that recharges on any rest (Safe Rest stays lit alongside it). Tests any-rest recharge with 1 use.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "techniqueType": "mechanical",
        "focus": {
          "traitId": "",
          "traitName": "",
          "scale": 2
        },
        "recharges": {
          "session": false,
          "safeRest": true,
          "unsafeRest": true
        },
        "uses": {
          "value": 1,
          "max": 1
        }
      }
    },
    {
      "id": "ardente",
      "type": "keyword",
      "img": "icons/magic/light/explosion-star-blue-yellow.webp",
      "name": {
        "pt-BR": "Ardente",
        "en": "Blazing"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Marca efeitos flamejantes e incendiários. Palavra-chave de teste para pills com texto ao passar o mouse.</p>",
          "en": "<p>Marks fiery and incendiary effects. Test keyword for pills with hover text.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "curativo",
      "type": "keyword",
      "img": "icons/magic/life/ankh-gold-blue.webp",
      "name": {
        "pt-BR": "Curativo",
        "en": "Healing"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Indica capacidade de restaurar e curar aliados. Palavra-chave evocativa para testar exibição de keywords.</p>",
          "en": "<p>Indicates the ability to restore and heal allies. Evocative keyword for testing keyword display.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "veloz",
      "type": "keyword",
      "img": "icons/magic/control/buff-luck-fortune-rainbow.webp",
      "name": {
        "pt-BR": "Veloz",
        "en": "Swift"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Denota rapidez excepcional e movimento ágil. Palavra-chave para testar hover de descrição.</p>",
          "en": "<p>Denotes exceptional speed and nimble movement. Keyword for testing description hover.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "sortudo",
      "type": "keyword",
      "img": "icons/magic/nature/cornucopia-orange.webp",
      "name": {
        "pt-BR": "Sortudo",
        "en": "Lucky"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Sinaliza favor da fortuna em momentos críticos. Palavra-chave de teste do sistema de pills.</p>",
          "en": "<p>Signals fortune's favor at critical moments. Test keyword for the pills system.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "erudito",
      "type": "keyword",
      "img": "icons/sundries/books/book-embossed-blue.webp",
      "name": {
        "pt-BR": "Erudito",
        "en": "Learned"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Representa vasto conhecimento e estudo aprofundado. Palavra-chave para verificar tooltips de keyword.</p>",
          "en": "<p>Represents vast knowledge and deep study. Keyword for checking keyword tooltips.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "amaldicoado",
      "type": "drawback",
      "img": "icons/magic/unholy/beam-impact-purple.webp",
      "name": {
        "pt-BR": "Amaldiçoado",
        "en": "Cursed"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Sob uma maldição que atrai infortúnio. Desvantagem de teste para pills de drawback com hover.</p>",
          "en": "<p>Under a curse that draws misfortune. Test drawback for drawback pills with hover.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "envenenado",
      "type": "drawback",
      "img": "icons/skills/toxins/cup-goblet-poisoned-spilled.webp",
      "name": {
        "pt-BR": "Envenenado",
        "en": "Poisoned"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Toxinas corroem o corpo aos poucos. Desvantagem evocativa para testar exibição de drawbacks.</p>",
          "en": "<p>Toxins corrode the body little by little. Evocative drawback for testing drawback display.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "fragil",
      "type": "drawback",
      "img": "icons/magic/death/bones-crossed-gray.webp",
      "name": {
        "pt-BR": "Frágil",
        "en": "Frail"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Resistência reduzida que cede sob pressão. Desvantagem para testar texto ao passar o mouse.</p>",
          "en": "<p>Reduced resilience that gives way under pressure. Drawback for testing hover text.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "medroso",
      "type": "drawback",
      "img": "icons/magic/control/fear-fright-mask-orange.webp",
      "name": {
        "pt-BR": "Medroso",
        "en": "Fearful"
      },
      "system": {
        "description": {
          "pt-BR": "<p>O medo domina diante do perigo iminente. Desvantagem de teste do sistema de pills.</p>",
          "en": "<p>Fear takes over in the face of looming danger. Test drawback for the pills system.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "exausto",
      "type": "drawback",
      "img": "icons/magic/unholy/barrier-fire-pink.webp",
      "name": {
        "pt-BR": "Exausto",
        "en": "Exhausted"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Fadiga profunda mina cada esforço. Desvantagem para verificar tooltips de drawback.</p>",
          "en": "<p>Deep fatigue saps every effort. Drawback for checking drawback tooltips.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        }
      }
    },
    {
      "id": "estalagem-do-viajante",
      "type": "landmark",
      "img": "icons/environment/settlement/blacksmith.webp",
      "name": {
        "pt-BR": "Estalagem do Viajante",
        "en": "The Traveler's Inn"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Pousada acolhedora onde se descansa em segurança. Marco seguro para testar descanso e a flag safe true.</p>",
          "en": "<p>A welcoming inn where one rests in safety. Safe landmark for testing rest and the safe true flag.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "safe": true
      }
    },
    {
      "id": "santuario-esquecido",
      "type": "landmark",
      "img": "icons/environment/settlement/church.webp",
      "name": {
        "pt-BR": "Santuário Esquecido",
        "en": "The Forgotten Sanctuary"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Templo silencioso que oferece refúgio e cura. Marco seguro para testar a flag safe true.</p>",
          "en": "<p>A silent temple offering refuge and healing. Safe landmark for testing the safe true flag.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "safe": true
      }
    },
    {
      "id": "cripta-dos-lamentos",
      "type": "landmark",
      "img": "icons/environment/settlement/graveyard.webp",
      "name": {
        "pt-BR": "Cripta dos Lamentos",
        "en": "Crypt of Laments"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Tumba sombria repleta de mortos inquietos. Marco inseguro para testar a flag safe false.</p>",
          "en": "<p>A grim tomb teeming with restless dead. Unsafe landmark for testing the safe false flag.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "safe": false
      }
    },
    {
      "id": "covil-na-montanha",
      "type": "landmark",
      "img": "icons/environment/wilderness/cave-entrance-mountain.webp",
      "name": {
        "pt-BR": "Covil na Montanha",
        "en": "Mountain Lair"
      },
      "system": {
        "description": {
          "pt-BR": "<p>Caverna perigosa que abriga predadores famintos. Marco inseguro para testar descanso arriscado e safe false.</p>",
          "en": "<p>A dangerous cave that shelters ravenous predators. Unsafe landmark for testing a risky rest and the safe false flag.</p>"
        },
        "source": {
          "pt-BR": "Sandbox",
          "en": "Test Fixtures"
        },
        "safe": false
      }
    }
  ]
};
