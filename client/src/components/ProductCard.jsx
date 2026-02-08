import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
    return (
        <div className="product-card">
            <div className="product-image-container">
                {product.quantity <= 10 && product.quantity > 0 && (
                    <span className="badge-warning">Limited Stock</span>
                )}
                {product.quantity === 0 && (
                    <span className="badge-error">Out of Stock</span>
                )}
                <Link to={`/product/${product._id}`}>
                    <img src={product.image || "https://placehold.co/300x200"} alt={product.name} className="product-image" />
                </Link>
            </div>

            <div className="product-info">
                <div className="product-meta">
                    <span className="category-tag">{product.category}</span>
                    <span className="location-tag">{product.location}</span>
                </div>

                <Link to={`/product/${product._id}`} className="product-title-link">
                    <h3 className="product-title">{product.name}</h3>
                </Link>

                <p className="product-description">{product.description?.substring(0, 60)}...</p>

                <div className="product-footer">
                    <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
                    <button className="btn-icon-cart" title="Add to Cart">
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
