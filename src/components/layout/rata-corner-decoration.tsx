export function RataCornerDecoration() {
  return (
    <>
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter
            id="rata-remove-white"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                -1 -1 -1 2.15 0
              "
            />
          </filter>
        </defs>
      </svg>
      <img
        src="/assets/rataimage.png"
        alt=""
        aria-hidden
        className="rata-corner-image pointer-events-none fixed right-0 bottom-0 -z-10 h-auto w-auto max-h-[min(67.5vh,630px)] max-w-[min(57vw,420px)] select-none object-contain object-right-bottom opacity-75"
        style={{ filter: "url(#rata-remove-white)" }}
      />
    </>
  );
}
