# pegasensi

Extensão do GNOME Shell para controlar a sensibilidade do mouse de forma prática e imediata. 

Compatível com GNOME Shell 49.

## Recursos

- Dois presets configuráveis de velocidade do mouse
- Slider para ajustar cada preset direto no menu da barra superior
- Botão de toggle para alternar entre os dois valores salvos
- Destaque visual do preset atualmente mais próximo da velocidade ativa

## Instalação

1. Copie a extensão para `~/.local/share/gnome-shell/extensions/pegasensi@nayetdet`
2. Compile os schemas:

```bash
glib-compile-schemas schemas
```

3. Habilite a extensão:

```bash
gnome-extensions enable pegasensi@nayetdet
```

## Uso

- Clique no ícone de mouse na barra superior
- Ajuste os sliders dos presets
- Use `Toggle` para alternar entre `Preset A` e `Preset B`

## Desenvolvimento

Sempre que alterar `schemas/org.gnome.shell.extensions.pegasensi.gschema.xml`, recompile:

```bash
glib-compile-schemas schemas
