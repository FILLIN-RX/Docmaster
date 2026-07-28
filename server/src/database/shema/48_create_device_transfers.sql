CREATE TABLE IF NOT EXISTS device_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES my_devices(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id),
    to_email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_transfers_token ON device_transfers(token);
CREATE INDEX idx_device_transfers_device_id ON device_transfers(device_id);
CREATE INDEX idx_device_transfers_to_email ON device_transfers(to_email);
