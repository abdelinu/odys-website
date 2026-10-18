#!/usr/bin/env python3
"""Le contraste d'une couleur sur le sol de la boutique.

Ecrit le rapport et sort 0 s'il atteint 4,5:1 — le plancher de WCAG 2.1 AA
pour du texte courant. Sort 1 sans rien ecrire sinon, pour que le shell
puisse s'en servir tel quel :

    ratio=$(python ../psbuild/contraste.py "$couleur")
    [ -n "$ratio" ] && ok "..." || no "..."

Le sol est --odys-cream, l'ivoire de toutes les pages. Le module de
fidelite porte la meme valeur dans AMB_SOL : si les deux se separent, ce
controle ne mesure plus ce que le visiteur voit.
"""
import sys

SOL = "F4EFE5"
EXIGE = 4.5


def luminance(hexa):
    """La luminance relative d'un #rrggbb, WCAG 2.1."""
    c = [int(hexa[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def rapport(a, b):
    la, lb = luminance(a) + 0.05, luminance(b) + 0.05
    return la / lb if la > lb else lb / la


def main(argv):
    couleur = (argv[1] if len(argv) > 1 else "").strip().lstrip("#")
    if len(couleur) != 6:
        return 1
    r = rapport(couleur, SOL)
    if r < EXIGE:
        return 1
    print(round(r, 2))
    return 0


def demo():
    """Le minimum qui tombe si le calcul se trompe."""
    assert abs(rapport("000000", "FFFFFF") - 21) < 0.01
    assert abs(rapport(SOL, SOL) - 1) < 0.001
    assert rapport("866437", SOL) >= EXIGE      # l'accent ambre borne
    assert rapport("E0A75C", SOL) < EXIGE       # celui du Back Office, brut
    print("contraste: les quatre mesures tiennent")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        demo()
    else:
        sys.exit(main(sys.argv))
