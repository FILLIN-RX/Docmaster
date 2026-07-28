import { render } from '@/test-utils';
import attributes from './attributes.json';
import { InputTooltip } from './InputTooltip';

describe('InputTooltip', () => {
  it('renders correctly', () => {
    render(<InputTooltip {...(attributes as any)} />);
  });
});
