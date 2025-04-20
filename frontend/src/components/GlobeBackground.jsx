import React, { useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';

const GlobeBackground = () => {
  const globeEl = useRef();

  useEffect(() => {
    // Enable auto-rotation
    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 0.6;

    // Set initial view
    globeEl.current.pointOfView({ lat: 30, lng: 30, altitude: 2.2 });
  }, []);

  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(255,255,255,0)" // Transparent so it's not dark
        showAtmosphere={true}
        atmosphereColor="white" // Brighter glow
        atmosphereAltitude={0.15}
      />
    </div>
  );
};

export default GlobeBackground;
