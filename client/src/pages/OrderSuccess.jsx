import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const OrderSuccess = () => {
    return (
        <>
            <Navbar />
            <div className="container text-center" style={{ padding: '4rem 0' }}>
                <div style={{ color: '#10b981', fontSize: '4rem', marginBottom: '1rem' }}>
                    ✔
                </div>
                <h1>Order Placed Successfully!</h1>
                <p>Thank you for your purchase. Your order has been confirmed.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to="/" className="btn-primary">Continue Shopping</Link>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;
