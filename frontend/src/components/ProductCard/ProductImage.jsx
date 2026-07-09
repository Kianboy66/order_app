
import { memo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import Badge from '../ui/Badge';

const DEFAULT_IMAGE = './advie1.jpeg';

function ProductImage({ src, alt, badge }) {
    const [imgSrc, setImgSrc] = useState(src || DEFAULT_IMAGE);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError) {
            setImgSrc(DEFAULT_IMAGE);
            setHasError(true);
        }
    };

    return (
        <div className="product-image">
            {hasError ? (
                <div className="product-image__placeholder">
                    <ImageOff size={32} strokeWidth={1.5} />
                </div>
            ) : (
                <img
                    src={imgSrc}
                    alt={alt}
                    loading="lazy"
                    className="product-image__img"
                    onError={handleError}
                />
            )}

            {badge && (
                <div className="product-image__badge">
                    <Badge variant="default" size="sm">
                        {badge}
                    </Badge>
                </div>
            )}
        </div>
    );
}

export default memo(ProductImage);
