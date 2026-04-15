import { cn } from '@/lib/format';

interface Props {
    className?: string;
    /** Tamanho (lado do quadrado) em px. Default 120. */
    size?: number;
    /**
     * Mantido por compatibilidade — o GIF é animado por natureza.
     * Quando `false`, aplica `animation-play-state: paused` via CSS não tem
     * efeito em GIF; nesse caso renderizamos uma classe que pode ser usada pra
     * atenuar (opacidade) se quiser indicação visual. Sem efeito real em GIF.
     */
    animated?: boolean;
}

/**
 * Logo da marca — GIF animado do capacete azul/preto em /public/helmet.gif.
 */
export default function MotorcycleLogo({ className, size = 120, animated = true }: Props) {
    // mix-blend-multiply "apaga" o fundo branco do GIF:
    //   light: white × white = white (bg), helmet colors preservadas
    //   dark:  white × dark  = dark  (bg), helmet fica um pouco mais escuro mas visível
    return (
        <img
            src="/helmet.gif"
            width={size}
            height={size}
            alt="Duas Rodas — Capacete"
            className={cn(
                'select-none mix-blend-multiply',
                !animated && 'opacity-90',
                className
            )}
            draggable={false}
        />
    );
}
