import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import chroma from 'chroma-js'
import getPixels from 'get-pixels'
// @ts-ignore
import getContrast from 'get-contrast'
// @ts-ignore
import colorable from 'colorable'
import { X } from 'react-feather'
// @ts-ignore
import { quantize } from 'gifenc'
// @ts-ignore
import getRgbaPalette from 'get-rgba-palette'
// @ts-ignore
import kmeans from 'kmeans-engine'
import pify from 'pify'

const COLORS_COUNT = 8


const ColorBlindness = ({ ...props }: any) => {
  const filters = [
    { label: 'Deuteranomaly', value: 'deuteranomaly', population: '2.7%' },
    { label: 'Protanomaly', value: 'protanomaly', population: '0.66%' },
    { label: 'Protanopia', value: 'protanopia', population: '0.59%' },
    { label: 'Deuteranopia', value: 'deuteranopia', population: '0.56%' },
    { label: 'Tritanopia', value: 'tritanopia', population: '0.016%' },
    { label: 'Tritanomaly', value: 'tritanomaly', population: '0.01%' },
    { label: 'Achromatopsia', value: 'achromatopsia', population: '<0.0001%' },
    { label: 'Achromatomaly', value: 'achromatomaly', population: 'Unknown %' },
  ]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2,1fr)',
        gap: '.5em',
        marginTop: '.5em',
      }}
    >
      {filters.map((f) => (
        <div
          key={f.value}
          title={f.label + ' ' + f.population}
          style={{
            outline: '1px solid rgba(0,0,0,.1)',
            overflow: 'hidden',
            filter: `url(#${f.value})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
          }}
          children={props.children}
        />
      ))}
      
    </div>
  )
}

const SVGFilter = () => {
  return (
<svg
        sx={{ visibility: 'hidden', height: 0 }}
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                0.558, 0.442, 0,     0, 0
                0,     0.242, 0.758, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="protanomaly">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.817, 0.183, 0,     0, 0
                0.333, 0.667, 0,     0, 0
                0,     0.125, 0.875, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                0.7,   0.3,   0,   0, 0
                0,     0.3,   0.7, 0, 0
                0,     0,     0,   1, 0"
            />
          </filter>
          <filter id="deuteranomaly">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.8,   0.2,   0,     0, 0
                0.258, 0.742, 0,     0, 0
                0,     0.142, 0.858, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                0,    0.433, 0.567, 0, 0
                0,    0.475, 0.525, 0, 0
                0,    0,     0,     1, 0"
            />
          </filter>
          <filter id="tritanomaly">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.967, 0.033, 0,     0, 0
                0,     0.733, 0.267, 0, 0
                0,     0.183, 0.817, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="achromatopsia">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.299, 0.587, 0.114, 0, 0
                0.299, 0.587, 0.114, 0, 0
                0.299, 0.587, 0.114, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="achromatomaly">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.618, 0.320, 0.062, 0, 0
                0.163, 0.775, 0.062, 0, 0
                0.163, 0.320, 0.516, 0, 0
                0,     0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
  )
}

const Cover = ({color, image}) => {
  return (
      <article style={{ 
          background: color, 
          borderRadius: '6px',
          padding: 12 
        }}>
        <img src={image} style={{ 
          width: '100%', 
          display: 'block' 
          }} />
      </article>
  )
}

const CoverGradientMask = ({color, color2, image}) => {
  return (
      <article style={{ 
        backgroundImage: 'linear-gradient(' + color +' 0%, '+color2+' 100%)', 
        borderRadius: '6px',
        padding: 12 
        }}>
        <img src={image} style={{ 
          width: '100%', 
          display: 'block',
          filter: 'grayscale(100%)',
          mixBlendMode: 'overlay',
          }} />
      </article>
  )
}

const CoverAngleBackground = ({color, image}) => {
  return (
    <article style={{ 
      background: color, 
      position: 'relative', 
      borderRadius: '6px', 
      overflow: 'hidden', 
      aspectRadio: '1 / 1' 
      }}>
      <img src={image} style={{ 
        mixBlendMode: 'multiply', 
        display: 'block', 
        filter: 'grayscale(100%)', 
        width: '100%', }} />
      <div style={{ 
        color: 'white',
        position: 'absolute', 
        display: 'flex',
        fontWeight: 700,
        fontSize: '18px',
        textTransform: 'uppercase',
        letterSpacing: '.015em',
        alignItems: 'flex-end',
        paddingBottom: '16px',
        paddingLeft: '16px',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(8deg,' + color+' 30%, rgba(0,0,0,0) 30%)',
      }}></div>
    </article>
  )
}

const randomItem = (arr) => {
  const randomIndex = Math.floor(Math.random() * arr.length)
  const item = arr[randomIndex]
  return item
}

export default function Web() {
  const [currentFile, setCurrentFile] = useState<any | null>(null)
  const [files, setFiles] = useState<any[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')

      reader.onload = async () => {
        getPixels(reader.result as string, async (err, img) => {
          if (err) {
            console.log('pixels could not be computed')
          }

          const pixelArrayAsRgb = []
          const pixelArrayAsLab = []
          const pixelArrayAsHsv = []
          const step = 4
          for (let i = 0, length = img.data.length; i < length; i += step) {
            const r = img.data[i]
            const g = img.data[i + 1]
            const b = img.data[i + 2]

            if (img.data[i + 3] > 127) {
              pixelArrayAsRgb.push({ r, g, b })
              const lab = chroma([r, g, b]).lab()
              pixelArrayAsLab.push({ l: lab[0], a: lab[1], b: lab[2] })
              const hsv = chroma([r, g, b]).hsv()
              pixelArrayAsHsv.push({ h: hsv[0], s: hsv[1], v: hsv[2] })
            }
          }

          const rgbRes = await pify(kmeans.clusterize)(pixelArrayAsRgb, {
            k: COLORS_COUNT,
            maxIterations: 3,
          })
          const labRes = await pify(kmeans.clusterize)(pixelArrayAsLab, {
            k: COLORS_COUNT,
            maxIterations: 3,
          })
          const hsvRes = await pify(kmeans.clusterize)(pixelArrayAsHsv, {
            k: COLORS_COUNT,
            maxIterations: 3,
          })

          const kmeansPalette: any[] = rgbRes.clusters.map((cluster) =>
            chroma([cluster.centroid.r, cluster.centroid.g, cluster.centroid.b])
          )
          const kmeansLabPalette: any[] = labRes.clusters.map((cluster) =>
            chroma.lab(
              cluster.centroid.l,
              cluster.centroid.a,
              cluster.centroid.b
            )
          )
          const kmeansHsvPalette: any[] = hsvRes.clusters.map((cluster) =>
            chroma.hsv(
              cluster.centroid.h,
              cluster.centroid.s,
              cluster.centroid.v
            )
          )

          setFiles((files) => [
            ...files,
            {
              name: file.name,
              pixels: img.data,
              src: reader.result,
              palettes: {
                quantize1: getRgbaPalette(img.data, COLORS_COUNT + 1).map((c) =>
                  chroma(c)
                ),
                quantize2: quantize(img.data, COLORS_COUNT).map((c) =>
                  chroma(c)
                ),
                kmeans: kmeansPalette,
                kmeansLab: kmeansLabPalette,
                kmeansHsv: kmeansHsvPalette,
              },
            },
          ])
        })
      }

      reader.readAsDataURL(file)
    })
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 4,
  })

  return (
    <div
      id="root"
      style={{
        width: '100vw',
        height: '100vh',
      }}
      {...getRootProps({
        onClick: (e) => e.stopPropagation(),
      })}
    >
      <input {...getInputProps()} />
      <header style={{ padding: '8px 16px', gap: '8px', borderBottom: '1px solid rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', }}>
        <h1 style={{ margin: 0, fontSize: '12px', marginBottom: '1px' }}>Palettes</h1>
      </header>
      {currentFile ? (
        <div>
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px',
            fontSize: '16px',
            fontWeight: 400,
          }}>
            
            <button 
            onClick={() => setCurrentFile(null)} 
            style={{
              cursor: 'pointer',
              appearance: 'none',
              WebKitAppearance: 'none',
              borderRadius: '9999px',
              borderWidth: '1px',
              borderStyle: 'solid',
              display: 'flex',
              alignItems: 'center',
              height: 24,
              width: 24,
              transition: 'all .25s ease-in-out',
              }}>
              <X size={16} /></button>
            {currentFile.name}
          </h3>
          <ImageView file={currentFile} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{ marginBottom: 16, maxWidth: '25%' }}
              onClick={() => setCurrentFile(file)}
            >
              <img key={i} src={file.src} style={{ width: '100%' }} />
              <Palette palette={file.palettes.quantize1} />
              <Palette palette={file.palettes.quantize2} />
              <Palette palette={file.palettes.kmeans} />
              <Palette palette={file.palettes.kmeansLab} />
              <Palette palette={file.palettes.kmeansHsv} />
            </div>
          ))}
        </div>
      )}
      <SVGFilter />
    </div>
  )
}

const ImageView = ({ file }: any) => {
  const [activePalette, setActivePalette] = useState('quantize1')
  const colors = file.palettes[activePalette]
  const textColors = colors.filter((c) =>
    getContrast.isAccessible('#fff', String(c))
  )
  const textColorsDark = colors.filter((c) =>
    getContrast.isAccessible('#000', String(c))
  )
  const colorCombos = colorable(
    colors.map((c) => String(c)),
    { compact: true, threshold: 3 }
  )
  const color1 = randomItem(colors)
  const color2 = randomItem(colors)

  return (
    <div>
      <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr 2fr 2fr', gap: '1rem', padding: '16px' }}>
        <div><img src={file.src} style={{ width: '320px', maxWidth: '100%' }} /></div>
        <div>
          <Palette
            onClick={() => setActivePalette('quantize1')}
            palette={file.palettes.quantize1}
            isActive={activePalette === 'quantize1'}
          />
          <Palette
            onClick={() => setActivePalette('quantize2')}
            palette={file.palettes.quantize2}
            isActive={activePalette === 'quantize2'}
          />
          <Palette
            onClick={() => setActivePalette('kmeans')}
            palette={file.palettes.kmeans}
            isActive={activePalette === 'kmeans'}
          />
          <Palette
            onClick={() => setActivePalette('kmeansLab')}
            palette={file.palettes.kmeansLab}
            isActive={activePalette === 'kmeansLab'}
          />
          <Palette
            onClick={() => setActivePalette('kmeansHsv')}
            palette={file.palettes.kmeansLab}
            isActive={activePalette === 'kmeansHsv'}
          />
        </div>
      </section>
      <section id='covers' style={{ padding: '0px 16px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      <article>
        <CoverGradientMask color={colors[0]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[0]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[1]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[1]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[2]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[2]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[3]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[3]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[4]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[4]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[5]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[5]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[6]} color2={colors[7]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[6]} color2={colors[7]} image={file.src} />
        </ColorBlindness>
      </article>
      <article>
        <CoverGradientMask color={colors[7]} color2={colors[0]} image={file.src} />
        <ColorBlindness>
          <CoverGradientMask color={colors[7]} color2={colors[0]} image={file.src} />
        </ColorBlindness>
      </article>
      </section>
      <section id='covers' style={{ marginTop: '32px', padding: '0px 16px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <article>
        <Cover color={colors[0]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[0]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[1]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[1]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[2]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[2]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[3]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[3]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[4]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[4]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[5]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[5]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[6]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[6]} image={file.src} />
        </ColorBlindness>
        </article>
        <article>
        <Cover color={colors[7]} image={file.src} />
        <ColorBlindness>
          <Cover color={colors[7]} image={file.src} />
        </ColorBlindness>
        </article>
      </section>
      <section style={{ marginTop: '512px'}}>
        <div>
          {textColors.map((color) => {
            return (
              <h3 key={color} style={{ color, marginRight: 8 }}>
                Aa
              </h3>
            )
          })}
        </div>
        <div>
          {colorCombos.map((combo) => {
            return (
              <div
                key={combo.color}
                style={{ backgroundColor: combo.hex, marginRight: 8 }}
              >
                {combo.combinations.map((color) => {
                  return (
                    <h3 key={color} style={{ color: color.hex, marginRight: 8 }}>
                      Aa
                    </h3>
                  )
                })}
              </div>
            )
          })}
        </div>
        </section>
    </div>
  )
}

const Palette = ({ palette, isActive, ...props }: any) => {
  return (
    <div
      {...props}
      style={{
        padding: 8,
        boxShadow: isActive ? 'inset 0 0 0 1px black' : 'none',
        display: 'inline-flex',
        width:'auto',
      }}
    >
      {palette.map((c) => (
        <div
          key={c}
          style={{
            width: 20,
            height: 20,
            backgroundColor: c,
          }}
        />
      ))}
    </div>
  )
}
